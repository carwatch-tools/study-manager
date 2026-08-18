<script lang="ts">
	import { base } from '$app/paths';
	import PrintInstruction from '$lib/components/download/PrintInstruction.svelte';
	import { barcodeProps } from '$lib/stores/configStore';
	import { PAPER_FORMATS, PAPER_FORMAT_A4, PAPER_FORMAT_LETTER } from '$lib/constants';
	import { barcodeDataArray, captionArray } from '$lib/stores/dataStore';
	import JsBarcode from 'jsbarcode';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import BackButton from '$lib/components/general/BackButton.svelte';

	onMount(async () => {
		await tick();

		if ($barcodeProps.hasBarcode) {
			$barcodeDataArray.forEach((data, i) => {
				JsBarcode('#barcode' + i, data, {
					format: 'EAN8',
					displayValue: false,
					width: 3,
					height: 80,
					flat: true,
					margin: 10
				});
			});
		}

		document.querySelectorAll<HTMLElement>('.adjust-text-size').forEach((element) => {
			adjustFontSize(element);
		});

		document.querySelectorAll<HTMLElement>('.label-text-only').forEach((element) => {
			adjustTextOnlyLabelSize(element);
		});
	});

	// page properties
	const paperFormat = $barcodeProps.useLetterFormat
		? PAPER_FORMATS[PAPER_FORMAT_LETTER]
		: PAPER_FORMATS[PAPER_FORMAT_A4];
	let width = `${paperFormat.widthMm}mm`;
	let height = `${paperFormat.heightMm}mm`;
	let colDist = $barcodeProps.colDist + 'mm';
	let rowDist = $barcodeProps.rowDist + 'mm';
	let paddingRight = $barcodeProps.rightMargin + 'mm';
	let paddingLeft = $barcodeProps.leftMargin + 'mm';
	let paddingTop = $barcodeProps.topMargin + 'mm';
	let paddingBottom = $barcodeProps.bottomMargin + 'mm';

	// label properties
	let cellsPerPage = $barcodeProps.numRows * $barcodeProps.numCols;
	let numBarcodes = $barcodeDataArray.length;
	let numPages: number = Math.ceil(numBarcodes / cellsPerPage);
	let pageWidth = paperFormat.widthMm;
	let pageHeight = paperFormat.heightMm;
	let labelWidth =
		(pageWidth -
			$barcodeProps.leftMargin -
			$barcodeProps.rightMargin -
			$barcodeProps.colDist * ($barcodeProps.numCols - 1)) /
			$barcodeProps.numCols +
		'mm';
	let labelHeight =
		(pageHeight -
			$barcodeProps.topMargin -
			$barcodeProps.bottomMargin -
			$barcodeProps.rowDist * ($barcodeProps.numRows - 1)) /
			$barcodeProps.numRows +
		'mm';

	function adjustFontSize(e: HTMLElement) {
		if (!e.parentElement) {
			return;
		}
		const parentWidth = e.parentElement.offsetWidth;
		let fontSize = parseInt(window.getComputedStyle(e, null).getPropertyValue('font-size'));

		while (e.offsetWidth > parentWidth && fontSize > 0) {
			fontSize--;
			e.style.fontSize = fontSize + 'px';
		}
	}

	function adjustTextOnlyLabelSize(label: HTMLElement) {
		const captions = Array.from(label.querySelectorAll<HTMLElement>('.text-only-caption'));
		if (captions.length === 0) {
			return;
		}

		const labelStyles = window.getComputedStyle(label);
		const availableWidth =
			label.clientWidth -
			parseCssPixels(labelStyles.paddingLeft) -
			parseCssPixels(labelStyles.paddingRight);
		const availableHeight =
			label.clientHeight -
			parseCssPixels(labelStyles.paddingTop) -
			parseCssPixels(labelStyles.paddingBottom);
		const rowGap = parseCssPixels(labelStyles.rowGap) * Math.max(captions.length - 1, 0);
		let fontSize = Math.min(
			...captions.map((caption) => parseCssPixels(window.getComputedStyle(caption).fontSize))
		);

		while (fontSize > 1 && !textOnlyLabelFits(captions, availableWidth, availableHeight, rowGap)) {
			fontSize -= 1;
			captions.forEach((caption) => {
				caption.style.fontSize = fontSize + 'px';
			});
		}
	}

	function textOnlyLabelFits(
		captions: HTMLElement[],
		availableWidth: number,
		availableHeight: number,
		rowGap: number
	) {
		const widestCaption = Math.max(...captions.map((caption) => caption.scrollWidth));
		const totalCaptionHeight =
			captions.reduce((sum, caption) => sum + caption.offsetHeight, 0) + rowGap;

		return widestCaption <= availableWidth && totalCaptionHeight <= availableHeight;
	}

	function parseCssPixels(value: string) {
		return Number.parseFloat(value) || 0;
	}

	function getTopCaption(caption: string) {
		if (!$barcodeProps.addName) {
			return '';
		}

		const lineBreakIndex = caption.indexOf('<br>');
		if (lineBreakIndex >= 0) {
			return caption.slice(0, lineBreakIndex);
		}

		const separatorIndex = caption.indexOf('_');
		return separatorIndex >= 0 ? caption.slice(0, separatorIndex) : caption;
	}

	function getBottomCaption(caption: string) {
		if (!$barcodeProps.addName) {
			return caption;
		}

		const lineBreakIndex = caption.indexOf('<br>');
		if (lineBreakIndex >= 0) {
			return caption.slice(lineBreakIndex + 4);
		}

		const separatorIndex = caption.indexOf('_');
		return separatorIndex >= 0 ? caption.slice(separatorIndex + 1) : caption;
	}
</script>

<div class="h-full">
	<BackButton parentRoute="download" />

	<PrintInstruction fileType={'barcodes'} widthMm={paperFormat.widthMm} />
	{#each Array(numPages) as _, page}
		<div
			class="page grid grid-cols-{`${$barcodeProps.numCols}`} bg-white"
			style="--width: {width}; --height: {height}; --label-width: {labelWidth}; --label-height: {labelHeight}"
			style:gap={`${rowDist} ${colDist}`}
			style:padding-top={paddingTop}
			style:padding-bottom={paddingBottom}
			style:padding-left={paddingLeft}
			style:padding-right={paddingRight}
		>
			{#each Array(cellsPerPage) as _, i}
				{#if !(page * cellsPerPage + i >= numBarcodes)}
					{#if $barcodeProps.hasBarcode}
						<div
							class="label label-barcode p-2 overflow-hidden"
							class:label-barcode-no-name={!$barcodeProps.addName}
						>
							{#if $barcodeProps.addName}
								<p class="adjust-text-size top-caption text-black px-2">
									{getTopCaption($captionArray[page * cellsPerPage + i])}
								</p>
							{:else}
								<div class="top-caption-spacer" aria-hidden="true" />
							{/if}
							<div class="barcode-shell">
								{#if $barcodeProps.printBarcodeValue}
									<p class="barcode-value text-black">
										{$barcodeDataArray[page * cellsPerPage + i]}
									</p>
								{/if}
								<svg class="barcode" id="barcode{page * cellsPerPage + i}" />
							</div>
							<p class="adjust-text-size bottom-caption text-black px-2">
								{getBottomCaption($captionArray[page * cellsPerPage + i])}
							</p>
						</div>
					{:else}
						<div
							class="label label-text-only overflow-hidden"
							class:label-text-only-single={!$barcodeProps.addName}
						>
							{#if $barcodeProps.addName}
								<p class="adjust-text-size text-only-caption top-caption text-black px-2">
									{getTopCaption($captionArray[page * cellsPerPage + i])}
								</p>
							{/if}
							<p class="adjust-text-size text-only-caption bottom-caption text-black px-2">
								{getBottomCaption($captionArray[page * cellsPerPage + i])}
							</p>
						</div>
					{/if}
				{:else}
					<!-- display empty labels to last page to preserve format -->
					<div class="label p-2 overflow-hidden">
						<svg class="barcode" />
						<p class="text-black print:hidden" />
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	* {
		box-sizing: border-box;
		-moz-box-sizing: border-box;
		-webkit-box-sizing: border-box;
	}

	.label {
		position: relative;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--label-width);
		height: var(--label-height);
		outline: 2px #000000 dotted;
	}

	.label-barcode {
		display: grid;
		grid-template-rows: auto 1fr auto;
		align-items: center;
		justify-items: center;
		padding-top: 2mm;
		padding-bottom: 2mm;
		row-gap: 0;
	}

	.label-barcode-no-name {
		grid-template-rows: 1fr auto;
		padding-top: 1mm;
	}

	.label-text-only {
		--label-text-min-padding: 3mm;
		display: grid;
		grid-template-rows: auto auto;
		align-content: center;
		justify-items: center;
		padding: var(--label-text-min-padding);
		row-gap: 2mm;
	}

	.label-text-only-single {
		grid-template-rows: auto;
	}

	.adjust-text-size {
		white-space: nowrap;
		text-overflow: ellipsis;
		max-width: none !important;
	}

	.barcode-shell {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 0;
		position: relative;
	}

	.label svg {
		max-width: 100%;
		max-height: 96%;
	}
	.label p {
		max-width: 100%;
		max-height: 100%;
		font-family: monospace, monospace;
		font-size: 0.72rem;
		overflow-wrap: break-word;
		word-wrap: break-word;
	}

	.label-text-only p {
		margin: 0;
	}

	.top-caption {
		text-align: center;
		line-height: 0.7;
	}

	.top-caption-spacer {
		height: calc(0.72rem * 0.9);
	}

	.label-barcode-no-name .top-caption-spacer {
		display: none;
	}

	.label-barcode-no-name .barcode-shell {
		grid-row: 1;
	}

	.label-barcode-no-name .bottom-caption {
		grid-row: 2;
	}

	.bottom-caption {
		text-align: center;
		line-height: 0.7;
	}

	.label-text-only .top-caption,
	.label-text-only .bottom-caption {
		font-size: clamp(0.9rem, 8mm, 1.75rem);
		line-height: 1;
	}

	.barcode-value {
		position: absolute;
		left: 1.5mm;
		top: 50%;
		transform: translate(-50%, -50%) rotate(-90deg) scale(0.75);
		transform-origin: center;
		font-size: 0.2rem;
		line-height: 1;
		white-space: nowrap;
		text-align: center;
		max-width: none;
		max-height: none;
	}

	.page {
		/*A4 format*/
		width: var(--width);
		height: var(--height);
		/*distance between pages*/
		margin-left: 10mm;
		margin-top: 10mm;
		background: white;
		outline: 3px #000000 solid;
	}

	@page {
		size: auto;
		margin: 0;
	}

	@media print {
		* {
			overflow: visible !important;
		}

		.label {
			outline: none;
			width: var(--label-width);
			height: var(--label-height);
		}

		.page {
			width: var(--width);
			height: var(--height);
			margin: 0;
			border: initial;
			border-radius: initial;
			min-height: initial;
			box-shadow: initial;
			background: initial;
			outline: none;
		}
	}
</style>
