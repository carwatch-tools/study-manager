<script lang="ts">
// @ts-nocheck

	import { Stepper } from "@skeletonlabs/skeleton";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { preparationCurrentStep, qrCodePropsValid, qrCodeSubmitAttempted } from "$lib/stores/configStore";

	let StudyForm;
	let BarcodeForm;
	let QrCodeForm;

	onMount(async () => {
		StudyForm = (await import('$lib/components/preparation/StudyForm.svelte')).default;
		BarcodeForm = (await import('$lib/components/preparation/BarcodeForm.svelte')).default;
		QrCodeForm = (await import('$lib/components/preparation/QrCodeForm.svelte')).default;
	});

	function onStepChange(e: CustomEvent<any>): void {
		preparationCurrentStep.set(e.detail.state.current + 1);
	}

	function onCompleteHandler(e: CustomEvent<any>): void {
		preparationCurrentStep.set(e.detail.state.current + 1);
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
		<Stepper
			start={$preparationCurrentStep - 1}
			on:step={onStepChange}
			on:complete={onCompleteHandler}
			class="w-11/12 max-w-[95rem]"
		>
			<svelte:component this={StudyForm}/>
			<svelte:component this={BarcodeForm}/>
			<svelte:component this={QrCodeForm}/>
		</Stepper>
	</div>
</div>

  
  
