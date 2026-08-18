<?php
/**
 * Syncs occurrence child posts for recurring events.
 *
 * When a parent event with recurrence is saved, creates/updates/deletes
 * child posts (one per occurrence) so the Query Loop can show one row per occurrence.
 * Children are invisible in admin and inherit all parent data except start/end date.
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

defined( 'ABSPATH' ) || exit;

/**
 * Occurrence sync service.
 */
class OccurrenceSync {
	use Singleton;

	/**
	 * Meta key marking a post as an auto-generated occurrence.
	 *
	 * @var string
	 */
	public const OCCURRENCE_META_KEY = '_event_is_occurrence';

	/**
	 * Bootstraps the class' actions.
	 *
	 * @return void
	 */
	public function boot(): void {
		add_action( 'save_post_event', [ $this, 'sync_occurrences_for_event' ], 20, 2 );
		add_action( 'rest_after_insert_event', [ $this, 'sync_occurrences_after_rest' ], 10, 2 );
		add_action( 'before_delete_post', [ $this, 'delete_children_before_parent' ], 10, 2 );
		add_action( 'trashed_post', [ $this, 'trash_children_when_parent_trashed' ], 10, 1 );
		add_action( 'untrashed_post', [ $this, 'restore_children_when_parent_restored' ], 10, 1 );
		add_action( 'transition_post_status', [ $this, 'sync_children_status' ], 10, 3 );
		add_action( 'pre_get_posts', [ $this, 'hide_occurrences_from_admin_list' ], 10, 1 );
		add_action( 'load-post.php', [ $this, 'redirect_occurrence_edit_to_parent' ], 5, 0 );
		add_filter( 'get_edit_post_link', [ $this, 'add_occurrence_redirect_nonce_to_edit_link' ], 10, 2 );
		add_action( 'pre_get_posts', [ $this, 'front_end_show_occurrences_only' ], 10, 1 );
		add_filter( 'query_loop_block_query_vars', [ $this, 'events_query_loop_order_by_start_date' ], 10, 1 );
		add_filter( 'wp_revisions_to_keep', [ $this, 'revisions_to_keep_for_occurrence' ], 10, 2 );
		add_filter( 'wp_event_revisions_to_keep', [ $this, 'revisions_to_keep_for_occurrence' ], 10, 2 );
		add_filter( 'wp_save_post_revision_post_has_changed', [ $this, 'prevent_revision_for_child_event' ], 10, 3 );
	}

	/**
	 * For the Events Query Loop variation, order by event_start_date (meta) and ensure event_recurrence = single.
	 *
	 * @param array $query Query vars for WP_Query.
	 * @return array Modified query vars.
	 */
	public function events_query_loop_order_by_start_date( array $query ): array {
		if ( ( $query['post_type'] ?? '' ) !== 'event' ) {
			return $query;
		}
		// Order all event query loops by event start date (meta). event_recurrence = single is added by pre_get_posts.
		$orderby = $query['orderby'] ?? '';
		if ( $orderby === 'event_start_date' || $orderby === 'date' || $orderby === '' ) {
			$query['meta_key'] = 'event_start_date';
			$query['orderby']  = 'meta_value';
		}
		$query['order'] = strtoupper( $query['order'] ?? 'ASC' ) === 'DESC' ? 'DESC' : 'ASC';
		return $query;
	}

	/**
	 * Sync after REST has written post meta (Gutenberg saves meta after save_post).
	 *
	 * @param \WP_Post         $post    Inserted/updated post.
	 * @param \WP_REST_Request $request REST request.
	 * @return void
	 */
	public function sync_occurrences_after_rest( \WP_Post $post, $request ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		$this->sync_occurrences_for_event( (int) $post->ID, $post );
	}

	/**
	 * Sync occurrence child posts when an event is saved.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @return void
	 */
	public function sync_occurrences_for_event( int $post_id, \WP_Post $post ): void {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// Only sync when the event is published (or similar); skip drafts so occurrence children are not created until publish/update.
		if ( $post->post_status === 'draft' ) {
			return;
		}

		// Do not sync when parent is in trash (trashing can trigger save_post - don't create duplicate children).
		if ( $post->post_status === 'trash' ) {
			return;
		}

		// Only run for top-level events (not for occurrence children).
		if ( (int) $post->post_parent > 0 ) {
			return;
		}

		$recurrence = get_post_meta( $post_id, 'event_recurrence', true );
		$recurrence = EventOccurrences::normalize_recurrence_type( $recurrence );

		// Prevent recursion when we insert/update children.
		remove_action( 'save_post_event', [ $this, 'sync_occurrences_for_event' ], 20 );

		if ( $recurrence === 'single' ) {
			$this->delete_children_of( $post_id );
			add_action( 'save_post_event', [ $this, 'sync_occurrences_for_event' ], 20, 2 );
			return;
		}

		$occurrences = EventOccurrences::get_occurrences_for_post( $post_id, 'event' );

		// Map occurrence start date (Y-m-d) to occurrence data.
		$needed = [];
		foreach ( $occurrences as $occ ) {
			$start_ymd            = gmdate( 'Y-m-d', strtotime( $occ['start'] ) );
			$end_ymd              = gmdate( 'Y-m-d', strtotime( $occ['end'] ) );
			$end_hi               = gmdate( 'H:i', strtotime( $occ['end'] ) );
			$needed[ $start_ymd ] = [
				'start_date' => $start_ymd,
				'end_date'   => $end_ymd,
				'start_time' => gmdate( 'H:i', strtotime( $occ['start'] ) ),
				// 23:59 is the implicit end-of-day when no end time was entered.
				'end_time'   => $end_hi === '23:59' ? '' : $end_hi,
			];
		}

		// Unhook the admin list filter so get_children and find_child_by_start_date see real post_parent.
		// Otherwise we get 0 existing children and create duplicates when save_post runs twice (e.g. block editor).
		// See https://wordpress.stackexchange.com/questions/3393/enable-disable-post-revisions-programmatically/3398#3398
		remove_action( 'pre_get_posts', [ $this, 'hide_occurrences_from_admin_list' ], 10 );
		try {
			$existing_children = $this->get_children( $post_id );

			// Delete children whose occurrence date is no longer in the list.
			foreach ( $existing_children as $child_id ) {
				$child_start = get_post_meta( $child_id, 'event_start_date', true );
				if ( ! is_string( $child_start ) || ! isset( $needed[ $child_start ] ) ) {
					wp_delete_post( $child_id, true );
				}
			}

			// Create or update child for each occurrence.
			$parent_data = $this->get_parent_data_for_children( $post_id );
			if ( $parent_data === null ) {
				add_action( 'save_post_event', [ $this, 'sync_occurrences_for_event' ], 20, 2 );
				return;
			}

			// Prevent revisions when creating/updating occurrence children.
			remove_action( 'pre_post_update', 'wp_save_post_revision', 10 );
			try {
				foreach ( $needed as $start_ymd => $dates ) {
					$child_id   = $this->find_child_by_start_date( $post_id, $start_ymd );
					$child_post = [
						'post_parent'  => $post_id,
						'post_type'    => 'event',
						'post_status'  => $parent_data['post_status'],
						'post_title'   => $parent_data['post_title'],
						'post_content' => $parent_data['post_content'],
						'post_excerpt' => $parent_data['post_excerpt'],
					];

					$meta = [
						'event_start_date'        => $dates['start_date'],
						'event_end_date'          => $dates['end_date'],
						'event_start_time'        => $dates['start_time'] ?? $parent_data['event_start_time'],
						'event_end_time'          => $dates['end_time'] ?? $parent_data['event_end_time'],
						'event_location'          => $parent_data['event_location'],
						'event_recurrence'        => 'single',
						self::OCCURRENCE_META_KEY => '1',
					];

					if ( $child_id ) {
						$this->update_occurrence_child( $child_id, $child_post );
						foreach ( $meta as $key => $value ) {
							update_post_meta( $child_id, $key, $value );
						}
						update_post_meta( $child_id, '_thumbnail_id', $parent_data['_thumbnail_id'] );
						wp_set_object_terms( $child_id, $parent_data['term_ids'], 'event_category' );
					} else {
						$child_id = wp_insert_post( array_merge( $child_post, [ 'meta_input' => $meta ] ), true );
						if ( ! is_wp_error( $child_id ) ) {
							update_post_meta( $child_id, '_thumbnail_id', $parent_data['_thumbnail_id'] );
							wp_set_object_terms( $child_id, $parent_data['term_ids'], 'event_category' );
						}
					}
				}
			} finally {
				add_action( 'pre_post_update', 'wp_save_post_revision', 10 );
			}
		} finally {
			add_action( 'pre_get_posts', [ $this, 'hide_occurrences_from_admin_list' ], 10 );
		}

		add_action( 'save_post_event', [ $this, 'sync_occurrences_for_event' ], 20, 2 );
	}

	/**
	 * Get existing occurrence child IDs for a parent event.
	 *
	 * @param int $parent_id Parent event post ID.
	 * @return int[]
	 */
	private function get_children( int $parent_id ): array {
		$query = new \WP_Query(
			[
				'post_type'      => 'event',
				'post_parent'    => $parent_id,
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => -1,
				'no_found_rows'  => true,
			]
		);
		return $query->posts ?? [];
	}

	/**
	 * Find a child post by its occurrence start date.
	 *
	 * @param int    $parent_id  Parent event ID.
	 * @param string $start_ymd  Start date Y-m-d.
	 * @return int 0 if not found.
	 */
	private function find_child_by_start_date( int $parent_id, string $start_ymd ): int {
		$query = new \WP_Query(
			[
				'post_type'      => 'event',
				'post_parent'    => $parent_id,
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => 1,
				'meta_query'     => [
					[
						'key'   => 'event_start_date',
						'value' => $start_ymd,
					],
				],
			]
		);
		$posts = $query->posts ?? [];
		return ! empty( $posts ) ? (int) $posts[0] : 0;
	}

	/**
	 * Get parent event data needed to create/update children.
	 *
	 * @param int $post_id Parent event ID.
	 * @return array<string, mixed>|null Null if parent invalid.
	 */
	private function get_parent_data_for_children( int $post_id ): ?array {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== 'event' ) {
			return null;
		}

		$term_ids = wp_get_object_terms( $post_id, 'event_category' );
		$ids      = is_array( $term_ids ) && ! is_wp_error( $term_ids )
			? wp_list_pluck( $term_ids, 'term_id' )
			: [];

		return [
			'post_status'      => $post->post_status,
			'post_title'       => $post->post_title,
			'post_content'     => $post->post_content,
			'post_excerpt'     => $post->post_excerpt,
			'_thumbnail_id'    => (string) get_post_meta( $post_id, '_thumbnail_id', true ),
			'event_start_time' => (string) get_post_meta( $post_id, 'event_start_time', true ),
			'event_end_time'   => (string) get_post_meta( $post_id, 'event_end_time', true ),
			'event_location'   => (string) get_post_meta( $post_id, 'event_location', true ),
			'term_ids'         => array_map( 'intval', $ids ),
		];
	}

	/**
	 * Update an occurrence child post via direct DB update (no hooks, no revisions).
	 *
	 * @param int   $child_id   Child post ID.
	 * @param array $child_post Array of post fields (post_title, post_content, post_excerpt, post_status, etc.).
	 * @return void
	 */
	private function update_occurrence_child( int $child_id, array $child_post ): void {
		global $wpdb;
		$now     = current_time( 'mysql' );
		$now_gmt = current_time( 'mysql', true );
		$data    = [
			'post_title'        => $child_post['post_title'] ?? '',
			'post_content'      => $child_post['post_content'] ?? '',
			'post_excerpt'      => $child_post['post_excerpt'] ?? '',
			'post_status'       => $child_post['post_status'] ?? 'publish',
			'post_modified'     => $now,
			'post_modified_gmt' => $now_gmt,
		];
		$wpdb->update(
			$wpdb->posts,
			$data,
			[ 'ID' => $child_id ],
			[ '%s', '%s', '%s', '%s', '%s', '%s' ],
			[ '%d' ]
		);
		clean_post_cache( $child_id );
	}

	/**
	 * Get child event post IDs for a parent using a direct DB query.
	 *
	 * Used for delete/trash/restore so the result is never altered by pre_get_posts
	 * (e.g. on the Events list screen), which would otherwise leave children behind.
	 *
	 * @param int $parent_id Parent event post ID.
	 * @return int[]
	 */
	private function get_children_ids_for_deletion( int $parent_id ): array {
		global $wpdb;
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'event' AND post_parent = %d",
				$parent_id
			)
		);
		return is_array( $ids ) ? array_map( 'intval', $ids ) : [];
	}

	/**
	 * Delete all occurrence children of a parent event.
	 *
	 * @param int $parent_id Parent event ID.
	 * @return void
	 */
	private function delete_children_of( int $parent_id ): void {
		$children = $this->get_children_ids_for_deletion( $parent_id );
		foreach ( $children as $child_id ) {
			wp_delete_post( (int) $child_id, true );
		}
	}

	/**
	 * When a parent event is deleted, delete its occurrence children first.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @return void
	 */
	public function delete_children_before_parent( int $post_id, \WP_Post $post ): void {
		if ( $post->post_type !== 'event' ) {
			return;
		}
		if ( (int) $post->post_parent > 0 ) {
			return;
		}
		$this->delete_children_of( $post_id );
	}

	/**
	 * When a parent event is trashed, trash its occurrence children.
	 * Unhooks self (and transition_post_status) during the loop so trashing children does not re-enter.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function trash_children_when_parent_trashed( int $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== 'event' || (int) $post->post_parent > 0 ) {
			return;
		}
		$children = $this->get_children_ids_for_deletion( $post_id );
		if ( empty( $children ) ) {
			return;
		}
		// Prevent re-entry when we trash each child (avoids recursion and plugin errors).
		remove_action( 'trashed_post', [ $this, 'trash_children_when_parent_trashed' ], 10 );
		remove_action( 'transition_post_status', [ $this, 'sync_children_status' ], 10 );
		try {
			foreach ( $children as $child_id ) {
				$child = get_post( $child_id );
				if ( $child && $child->post_status !== 'trash' ) {
					wp_trash_post( (int) $child_id );
				}
			}
		} finally {
			add_action( 'trashed_post', [ $this, 'trash_children_when_parent_trashed' ], 10, 1 );
			add_action( 'transition_post_status', [ $this, 'sync_children_status' ], 10, 3 );
		}
	}

	/**
	 * When a parent event is restored from trash, restore its occurrence children.
	 *
	 * @param int $post_id Post ID that was restored.
	 * @return void
	 */
	public function restore_children_when_parent_restored( int $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== 'event' || (int) $post->post_parent > 0 ) {
			return;
		}
		$children = $this->get_children_ids_for_deletion( $post_id );
		if ( empty( $children ) ) {
			return;
		}
		remove_action( 'untrashed_post', [ $this, 'restore_children_when_parent_restored' ], 10 );
		try {
			foreach ( $children as $child_id ) {
				$child = get_post( $child_id );
				if ( $child && $child->post_status === 'trash' ) {
					wp_untrash_post( (int) $child_id );
				}
			}
		} finally {
			add_action( 'untrashed_post', [ $this, 'restore_children_when_parent_restored' ], 10, 1 );
		}
	}

	/**
	 * When a parent event's status changes, sync children status.
	 *
	 * @param string   $new_status New status.
	 * @param string   $old_status Old status.
	 * @param \WP_Post $post       Post object.
	 * @return void
	 */
	public function sync_children_status( string $new_status, string $old_status, \WP_Post $post ): void {
		if ( $post->post_type !== 'event' || (int) $post->post_parent > 0 ) {
			return;
		}
		if ( $new_status === $old_status ) {
			return;
		}
		// When restoring from trash, do not sync status to children; they are restored by
		// restore_children_when_parent_restored() and should keep their pre-trash status.
		if ( $old_status === 'trash' ) {
			return;
		}
		$children = $this->get_children( (int) $post->ID );
		foreach ( $children as $child_id ) {
			wp_update_post(
				[
					'ID'          => $child_id,
					'post_status' => $new_status,
				]
			);
		}
	}

	/**
	 * Hide occurrence child posts from the Events list in admin.
	 *
	 * @param \WP_Query $query Query object.
	 * @return void
	 */
	public function hide_occurrences_from_admin_list( \WP_Query $query ): void {
		if ( ! is_admin() ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || $screen->id !== 'edit-event' ) {
			return;
		}
		if ( $query->get( 'post_type' ) !== 'event' ) {
			return;
		}
		// Do not override when we are explicitly querying for a specific parent's children
		// (e.g. get_children() during parent deletion). Otherwise we would find 0 children
		// and leave occurrence posts behind when the parent is deleted.
		if ( (int) $query->get( 'post_parent' ) > 0 ) {
			return;
		}
		$query->set( 'post_parent', 0 );
	}

	/**
	 * Adds a nonce to the edit post link for occurrence posts so we can verify before redirecting.
	 *
	 * @param string $link    The edit link.
	 * @param int    $post_id Post ID.
	 * @return string Modified link.
	 */
	public function add_occurrence_redirect_nonce_to_edit_link( string $link, int $post_id ): string {
		if ( get_post_meta( $post_id, self::OCCURRENCE_META_KEY, true ) !== '1' ) {
			return $link;
		}
		return add_query_arg(
			'_occurrence_redirect_nonce',
			wp_create_nonce( 'occurrence_redirect_' . $post_id ),
			$link
		);
	}

	/**
	 * Disable revisions for occurrence child posts (they are synced from the parent).
	 *
	 * Any event with post_parent > 0 is a child; we don't rely on meta here because
	 * wp_revisions_to_keep can run during wp_update_post before we run update_post_meta.
	 *
	 * @param int      $num  Number of revisions to keep.
	 * @param \WP_Post $post Post object.
	 * @return int
	 */
	public function revisions_to_keep_for_occurrence( int $num, \WP_Post $post ): int {
		if ( $post->post_type !== 'event' || (int) $post->post_parent <= 0 ) {
			return $num;
		}
		return 0;
	}

	/**
	 * Prevent saving a revision when the post is an event child (occurrence).
	 *
	 * @param bool     $post_has_changed Whether the post has changed.
	 * @param \WP_Post $latest_revision  Latest revision post object.
	 * @param \WP_Post $post             The post being saved.
	 * @return bool
	 */
	public function prevent_revision_for_child_event( bool $post_has_changed, \WP_Post $latest_revision, \WP_Post $post ): bool {
		if ( $post->post_type !== 'event' || (int) $post->post_parent <= 0 ) {
			return $post_has_changed;
		}
		return false;
	}

	/**
	 * Redirect editing an occurrence post to the parent event edit screen.
	 *
	 * Only redirects when the request includes a valid nonce and the user can edit the post.
	 *
	 * @return void
	 */
	public function redirect_occurrence_edit_to_parent(): void {
		$post_id = isset( $_GET['post'] ) ? (int) $_GET['post'] : 0;
		if ( $post_id <= 0 ) {
			return;
		}

		$nonce = isset( $_GET['_occurrence_redirect_nonce'] ) && is_string( $_GET['_occurrence_redirect_nonce'] )
			? sanitize_text_field( wp_unslash( $_GET['_occurrence_redirect_nonce'] ) )
			: '';
		if ( $nonce === '' || ! wp_verify_nonce( $nonce, 'occurrence_redirect_' . $post_id ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$is_occurrence = get_post_meta( $post_id, self::OCCURRENCE_META_KEY, true );
		if ( $is_occurrence !== '1' ) {
			return;
		}
		$post = get_post( $post_id );
		if ( ! $post || $post->post_type !== 'event' || (int) $post->post_parent <= 0 ) {
			return;
		}
		$parent_id = (int) $post->post_parent;
		wp_safe_redirect( admin_url( 'post.php?post=' . $parent_id . '&action=edit' ) );
		exit;
	}

	/**
	 * On the front end, event queries show only single events + occurrence children (exclude recurring parents).
	 *
	 * @param \WP_Query $query Query object.
	 * @return void
	 */
	public function front_end_show_occurrences_only( \WP_Query $query ): void {
		if ( is_admin() ) {
			return;
		}
		if ( $query->get( 'post_type' ) !== 'event' ) {
			return;
		}
		if ( $query->get( 'sem_calendar_parents' ) ) {
			return;
		}
		$existing_meta     = $query->get( 'meta_query' );
		$occurrence_clause = [
			'key'   => 'event_recurrence',
			'value' => 'single',
		];
		if ( is_array( $existing_meta ) && ! empty( $existing_meta ) ) {
			$query->set( 'meta_query', array_merge( [ $occurrence_clause ], $existing_meta ) );
		} else {
			$query->set( 'meta_query', [ $occurrence_clause ] );
		}
	}
}
