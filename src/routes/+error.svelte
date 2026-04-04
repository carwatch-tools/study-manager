<script>
	import { base } from '$app/paths';
	import { page } from '$app/stores';
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
        <h1>{$page.status}: {$page.error?.message}</h1>
        <a href="{base}/" class="btn variant-filled">Go Back Home</a>
    </div>
</div>
