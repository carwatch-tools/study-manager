<script lang="ts">
	import { browser } from "$app/environment";
	import logo from "$lib/assets/logo.png";
	import data from "$lib/assets/data.png";
	import labels from "$lib/assets/labels.png";
	import setup from "$lib/assets/setup.png";
	import app from "$lib/assets/app.png";
	import { Accordion, AccordionItem } from "@skeletonlabs/skeleton";
	import { base } from "$app/paths";

	function scrollToNextPage(event: any) {
		const el = document.querySelector(event.target.hash);
		if (!el) return;
		el.scrollIntoView({
			behavior: 'smooth'
		});
	}

	function toggleAccordion(event: any){
		let el = document.getElementById("demo-img");
		if(event.detail.open && browser && el instanceof HTMLImageElement){
			switch (event.detail.id) {
				case "accordion-control-setup":
					el.src = setup;
					break;
				case "accordion-control-labels":
					el.src = labels;
					break;
				case "accordion-control-app":
					el.src = app;
					break;
				case "accordion-control-data":
					el.src = data;
					break;
				default:
					break;
			}
		}
	}
</script>

<div class="grid grid-cols-3 gap-4 md:gap-10 items-center justify-items-center h-screen">
	<div class="flex flex-col col-span-2 row-span-3 items-center xl:items-start text-center xl:text-left space-y-4">
		<h1 class="!text-5xl md:!text-6xl max-w-[800px]">CARWatch Study Manager</h1>
		<p class="!text-xl max-w-[675px]">
			<b>The Study Manager is the CARWatch web interface for study preparation, barcode and QR-code generation, and post-study log processing.</b>
		</p>
		<p class="!text-xl max-w-[675px]">
			<b>It has the following features:</b>
		</p>
		<p class="!text-xl max-w-[675px]">
			<span class="mr-6">&#9200;</span>Prepare study settings and sampling schedules in the browser
		</p>
		<p class="!text-xl max-w-[675px]">
			<span class="mr-6">&#127968;</span>Generate printable labels, barcodes, and setup QR codes for field studies
		</p>
		<p class="!text-xl max-w-[675px]">
			<span class="mr-6">&#129404;</span>Process exported CARWatch logs locally in your browser
		</p>

		<p class="!text-xl max-w-[675px] pt-2">
			For the full CARWatch framework, app downloads, publications, and project background, visit the <a class="underline" href="https://carwatch-tools.github.io/" target="_blank" rel="noreferrer">main CARWatch page</a>.
		</p>
		<div class="flex gap-8">
			<a href="{base}/study-configuration" class="btn variant-filled-primary">
				<span class="text-xl">Study Configuration</span>
				<i class="fa-solid fa-arrow-right-long" />
			</a>
			<a href="{base}/postprocessing" class="btn variant-filled-primary">
				<span class="text-xl">Log File Processing</span>
				<i class="fa-solid fa-arrow-right-long" />
			</a>
			<!-- <a href="https://carwatch-tools.github.io/" target="_blank" rel="noreferrer" class="btn variant-soft-primary">
				<span class="text-xl">Further Information on CARWatch</span>
				<i class="fa-solid fa-arrow-up-right-from-square" />
			</a> -->
		</div>
	</div>
	<div class="w-full hidden md:inline-block row-span-3 max-w-[250px] mx-auto">
		<img src={logo} alt="CARWatch Logo">
	</div>
	<div class="flex flex-col col-span-3 items-center">
			<span class="material-symbols-outlined text-7xl">
		<a href="#page-2" on:click|preventDefault={scrollToNextPage}>
				keyboard_double_arrow_down
		</a>
			</span>
	</div>
</div>

<div class="grid xl:grid-cols-2 grid-cols-1 gap-4 md:gap-10 items-center justify-items-center h-screen" id="page-2">
	<div class="flex flex-col items-center xl:items-start text-center xl:text-left space-y-4">
		<div class="md:w-[700px] w-full xl:h-[450px] h-1/2 card p-8 variant-glass-primary">
			<Accordion autocollapse>
				<AccordionItem id="setup" open on:toggle={toggleAccordion}>
					<svelte:fragment slot="lead">
						<span class="material-symbols-outlined">
							tune
						</span>
					</svelte:fragment>
					<svelte:fragment slot="summary">
						<h3 class="h3">Study preparation</h3>
					</svelte:fragment>
					<svelte:fragment slot="content">
						<div>
							<ul class="list">
								<li><span>&#8226;</span>
									<span class="flex-auto">Study preparation in the browser</span>
								</li>
								<li><span>&#8226;</span>
									<span class="flex-auto">Customize study properties to your needs</span>
								</li>
								<li><span>&#8226;</span>
									<span class="flex-auto">Set up your desired sampling schedule</span>
								</li>
								<li><span>&#8226;</span>
									<span class="flex-auto">Generate a QR-Code for the CARWatch smartphone app to automatically configure the study</span>
								</li>
							</ul>
						</div>
					</svelte:fragment>
				</AccordionItem>
				<AccordionItem id="labels" on:toggle={toggleAccordion}>
					<svelte:fragment slot="lead">
						<span class="material-symbols-outlined">
							barcode_scanner
						</span>
					</svelte:fragment>
					<svelte:fragment slot="summary">
						<h3 class="h3">Create printable barcode labels</h3>
					</svelte:fragment>
					<svelte:fragment slot="content"><div>
						<ul class="list">
							<li><span>&#8226;</span>
								<span class="flex-auto">Barcodes are placed on the saliva tubes and scanned by the smartphone when they are taken</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Scan times are used to objectively determine saliva sampling times</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Customize the number of saliva samples per day, the number of sampling days, and the number of study participants. You can also choose to add an optional, additional evening saliva sample.</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Customize barcodes to fit your printable label templates</span>
							</li>
						</ul>
					</div></svelte:fragment>
				</AccordionItem>
				<AccordionItem id="app" on:toggle={toggleAccordion}>
					<svelte:fragment slot="lead">
						<span class="material-symbols-outlined">
							phone_iphone
						</span>
					</svelte:fragment>
					<svelte:fragment slot="summary">
						<h3 class="h3">Use CARWatch app during your study</h3>
					</svelte:fragment>
					<svelte:fragment slot="content">
						<ul class="list">
							<li><span>&#8226;</span>
								<span class="flex-auto">Download App from <a href="https://play.google.com/store/apps/details?id=de.fau.cs.mad.carwatch">Google Play Store</a></span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Easy setup: Just scan the generated QR-Code to configure the app for your study</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Schedule and track sampling times in the app</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Export the app logs and share via email</span>
							</li>
						</ul>
					</svelte:fragment>
				</AccordionItem>
				<AccordionItem id="data" open on:toggle={toggleAccordion}>
					<svelte:fragment slot="lead">
						<span class="material-symbols-outlined">
							quick_reference_all
						</span>
					</svelte:fragment>
					<svelte:fragment slot="summary">
						<h3 class="h3">Process CARWatch log data</h3>
					</svelte:fragment>
					<svelte:fragment slot="content">
						<ul class="list">
							<li><span>&#8226;</span>
								<span class="flex-auto">Extract the sampling timestamps from the log data</span>
							</li>
							<li><span>&#8226;</span>
								<span class="flex-auto">Extract the self-reported awakening times (if available)</span>
							</li>
						</ul>
					</svelte:fragment>
				</AccordionItem>
			</Accordion>
		</div>
	</div>
	<div class="md:w-[700px] w-full xl:h-[450px] h-1/2 hidden md:inline-block mx-auto card p-8 variant-glass-primary">
		<img src={setup} alt="CARWatch Features" id="demo-img" class="h-full m-auto object-contain">
	</div>
</div>
