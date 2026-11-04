<form role="search" method="get" class="search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="sr-only" for="s-<?php echo esc_attr( wp_unique_id() ); ?>">جست‌وجو</label>
	<input type="search" id="s-<?php echo esc_attr( wp_unique_id() ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="جست‌وجو…">
	<button type="submit" class="btn btn--primary">جست‌وجو</button>
</form>
