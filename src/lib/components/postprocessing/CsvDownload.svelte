<script>
	export let filesSubmitted = false;
	export let downloadEnabled = false;
	export let csvData = '';

	function downloadCsv() {
		const filename = 'study_results.csv';
		const blob = new Blob([csvData], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;

		document.body.appendChild(a);
		a.click();

		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function processMoreFiles() {
		filesSubmitted = false;
		downloadEnabled = false;
		csvData = '';
	}
</script>

<div class="container h-full mx-auto flex justify-center items-center text-center">
	<div class="w-1/2 space-y-6 my-6">
		<section class="w-full p-4 space-y-4">
			{#if downloadEnabled}
				<p>Processing finished!</p>
			{:else}
				<p>Files are being processed...</p>
			{/if}
		</section>
		<section class="w-full flex justify-center items-center">
			<button
				on:click={downloadCsv}
				type="button"
				class="btn variant-filled-primary p-6 mt-6"
				disabled={!downloadEnabled}
			>
				<span class="material-symbols-outlined">download</span>
				<span class="flex-1 text-center">Download CSV</span>
			</button>
		</section>
		{#if downloadEnabled}
			<section class="w-full flex justify-center items-center">
				<button on:click={processMoreFiles} type="button" class="btn variant-filled-secondary p-6">
					<span class="material-symbols-outlined">arrow_back</span>
					<span class="flex-1 text-center">Process More Log Files</span>
				</button>
			</section>
		{/if}
	</div>
</div>
