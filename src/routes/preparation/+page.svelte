<script lang="ts">
// @ts-nocheck

	import { Stepper } from "@skeletonlabs/skeleton";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { qrCodePropsValid, qrCodeSubmitAttempted } from "$lib/stores/configStore";

	let StudyForm;
	let BarcodeForm;
	let QrCodeForm;
	let startStep = 0;
	let stepperReady = false;

	onMount(async () => {
		const stepParam = Number(new URLSearchParams(window.location.search).get('step'));
		startStep = Number.isFinite(stepParam) && stepParam >= 1 ? stepParam - 1 : 0;
		if (window.location.search.includes('step=')) {
			window.history.replaceState(window.history.state, '', window.location.pathname);
		}

		StudyForm = (await import('$lib/components/preparation/StudyForm.svelte')).default;
		BarcodeForm = (await import('$lib/components/preparation/BarcodeForm.svelte')).default;
		QrCodeForm = (await import('$lib/components/preparation/QrCodeForm.svelte')).default;
		stepperReady = true;
	});


	function onCompleteHandler(e: CustomEvent<any>): void {
		if (!get(qrCodePropsValid)) {
			qrCodeSubmitAttempted.set(true);
			return;
		}
		qrCodeSubmitAttempted.set(false);
		goto("download");
	}


</script>

<div class="p-6 h-full overflow-y-auto">
	<div class="flex justify-center items-start min-h-full pt-4">
		{#if stepperReady}
			{#key startStep}
				<Stepper start={startStep} on:complete={onCompleteHandler} class="w-11/12 max-w-[95rem]">
					<svelte:component this={StudyForm}/>
					<svelte:component this={BarcodeForm}/>
					<svelte:component this={QrCodeForm}/>
				</Stepper>
			{/key}
		{/if}
	</div>
</div>

  
  
