<script lang="ts">
	import { base } from "$app/paths";
	import PrintInstruction from "$lib/components/download/PrintInstruction.svelte";
  import { barcodeProps } from "$lib/stores/configStore";
	import { PAPER_FORMATS, PAPER_FORMAT_A4, PAPER_FORMAT_LETTER } from "$lib/constants";
  import { barcodeDataArray, captionArray} from "$lib/stores/dataStore";
	import JsBarcode from 'jsbarcode';
	import { onMount } from "svelte";
	import { tick } from "svelte";
	import BackButton from "$lib/components/general/BackButton.svelte";

    onMount(async() => {
        await tick();

        if($barcodeProps.hasBarcode){
            $barcodeDataArray.forEach((data, i) => {
                JsBarcode("#barcode" + i, data, {
                    format: "EAN8",
                    displayValue: false,
                    width: 3, 
                    height: 80, 
                    flat:true,
                    margin: 10,
                });  
            }); 
        }

        document.querySelectorAll('.adjust-text-size').forEach(element => {
            adjustFontSize(element);
        })
    });

    // page properties
    const paperFormat = $barcodeProps.useLetterFormat ? PAPER_FORMATS[PAPER_FORMAT_LETTER] : PAPER_FORMATS[PAPER_FORMAT_A4];
    let width = `${paperFormat.widthMm}mm`;
    let height = `${paperFormat.heightMm}mm`;
    let colDist = $barcodeProps.colDist + "mm";
    let rowDist = $barcodeProps.rowDist + "mm";
    let paddingRight= $barcodeProps.rightMargin + "mm"; 
    let paddingLeft = $barcodeProps.leftMargin + "mm";
    let paddingTop = $barcodeProps.topMargin + "mm";
    let paddingBottom = $barcodeProps.bottomMargin + "mm";

    // label properties
    let cellsPerPage = $barcodeProps.numRows * $barcodeProps.numCols;
    let numBarcodes = $barcodeDataArray.length 
    let numPages: number = Math.ceil(numBarcodes / cellsPerPage)
    let pageWidth = paperFormat.widthMm;
    let pageHeight = paperFormat.heightMm;
    let labelWidth = (pageWidth - $barcodeProps.leftMargin - $barcodeProps.rightMargin - $barcodeProps.colDist * ($barcodeProps.numCols - 1)) / $barcodeProps.numCols + "mm";
    let labelHeight = (pageHeight - $barcodeProps.topMargin - $barcodeProps.bottomMargin - $barcodeProps.rowDist * ($barcodeProps.numRows - 1)) / $barcodeProps.numRows + "mm";

    function adjustFontSize(e) {
        const parentWidth = e.parentElement.offsetWidth;
        let fontSize = parseInt(window.getComputedStyle(e, null).getPropertyValue('font-size'));

        while (e.offsetWidth > parentWidth && fontSize > 0) {
            fontSize--;
            e.style.fontSize = fontSize + "px";
        }
    }

	function getTopCaption(caption: string) {
		if (!$barcodeProps.addName) {
			return "";
		}

		const separatorIndex = caption.indexOf("_");
		return separatorIndex >= 0 ? caption.slice(0, separatorIndex) : caption;
	}

	function getBottomCaption(caption: string) {
		if (!$barcodeProps.addName) {
			return caption;
		}

		const separatorIndex = caption.indexOf("_");
		return separatorIndex >= 0 ? caption.slice(separatorIndex + 1) : caption;
	}
</script>


<div class="h-full">
    <BackButton parentRoute="download" />

    <PrintInstruction fileType={"barcodes"} widthMm={paperFormat.widthMm}/>
    {#each Array(numPages) as _, page}
        <div class="page grid grid-cols-{`${$barcodeProps.numCols}`} bg-white" style="--width: {width}; --height: {height}" style:gap={`${rowDist} ${colDist}`} style:padding-top={paddingTop} style:padding-bottom={paddingBottom} style:padding-left={paddingLeft} style:padding-right={paddingRight}>
            {#each Array(cellsPerPage) as _, i}
                {#if !(page*cellsPerPage + i >= numBarcodes)}
                    {#if $barcodeProps.hasBarcode}
                        <div class="label label-barcode p-2 overflow-hidden" class:label-barcode-no-name={!$barcodeProps.addName} class:label-barcode-with-value={$barcodeProps.printBarcodeValue} style="--label-width: {labelWidth}; --label-height: {labelHeight}">
							{#if $barcodeProps.addName}
								<p class="adjust-text-size top-caption text-black px-2">{getTopCaption($captionArray[page*cellsPerPage + i])}</p>
							{:else}
								<div class="top-caption-spacer" aria-hidden="true"></div>
							{/if}
							<div class="barcode-shell">
								{#if $barcodeProps.printBarcodeValue}
									<p class="barcode-value text-black">{$barcodeDataArray[page*cellsPerPage + i]}</p>
								{/if}
                            	<svg class="barcode" id="barcode{page*cellsPerPage + i}"></svg>
							</div>
                            <p class="adjust-text-size bottom-caption text-black px-2">{getBottomCaption($captionArray[page*cellsPerPage + i])}</p>
                        </div>
                    {:else}
                        <div class="label p-2 overflow-hidden items-center" style="--label-width: {labelWidth}; --label-height: {labelHeight}">
                            <svg class="barcode"></svg>
                            <p class="adjust-text-size text-black px-2 text-center" style:font-size=large>{@html $captionArray[page*cellsPerPage + i]}</p>
                        </div>
                    {/if}
                {:else}
                <!-- display empty labels to last page to preserve format -->
                <div class="label p-2 overflow-hidden">
                    <svg class="barcode"></svg>
                    <p class="text-black print:hidden"></p>
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
			padding-left: 0;
		}

		.label-barcode-with-value .barcode-shell {
			padding-left: 3.5mm;
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

		.top-caption {
			text-align: center;
			line-height: 0.9;
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
			line-height: 0.9;
		}

		.barcode-value {
			position: absolute;
			left: 1.5mm;
			top: 50%;
			transform: translate(-50%, -50%) rotate(-90deg);
			transform-origin: center;
			font-size: 0.2rem;
			line-height: 1;
			white-space: nowrap;
			text-align: center;
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
