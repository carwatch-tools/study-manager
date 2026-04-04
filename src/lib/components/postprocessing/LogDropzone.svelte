<script lang="ts">
	import { collectData, dataToWideFormat } from '$lib/postprocessing/logCleaning';
	import {
		extractZip,
		getDateFromFileName,
		getParticipantFromFileName,
		getStudyFromFileName,
		objectIsEmpty
	} from '$lib/postprocessing/utils';
	import { FileDropzone, toastStore, type ToastSettings, Toast } from '@skeletonlabs/skeleton';
	import Papa from 'papaparse';
	import SelectedFileList from './SelectedFileList.svelte';

	export let files: FileList = <FileList>{};
	export let filesUploaded: boolean = false;
	export let filesSubmitted: boolean = false;

	export let downloadEnabled: boolean = false;
	export let csvData: string = "";

	function handleUpload(e: Event) {
		filesUploaded = true;
	}

	function handleSubmit() {
		filesSubmitted = true;
		extractZip(files).then((data) => {
			let result = data.map((file: { name: string, data: any[] }) => {
				let date = getDateFromFileName(file.name);
				let studyName = getStudyFromFileName(file.name)
				let participant = getParticipantFromFileName(file.name);
				let info = collectData(file.data);
				return {study: studyName, participant: participant, date: date, info: info}
			})
			.filter((entry) => !objectIsEmpty(entry.info));
			let csvArray = dataToWideFormat(result);
			csvData = Papa.unparse(csvArray);
			downloadEnabled = true;
		}).catch((err) => {
			const t: ToastSettings = {
				message: 'An error occurred while processing your data:<br>' + err + '<br>Please make sure you uploaded the correct file(s) and try again.',
				autohide: false, 
			};
			toastStore.trigger(t);
			filesSubmitted = false;
			filesUploaded = false;
		});
	}

</script>

<Toast />
<form class="container h-full mx-auto flex justify-center items-center" on:submit|preventDefault={handleSubmit}>
		<div class="w-1/2 space-y-6 my-6">
			<FileDropzone
				name="file"
				id="file"
				bind:files
				on:change={handleUpload}
				accept=".zip"
				multiple
			>
				<svelte:fragment slot="lead">
					<span class="material-symbols-outlined">upload_file</span>
				</svelte:fragment>
				<svelte:fragment slot="message"><b>Upload files</b> or drag and drop.</svelte:fragment>
				<svelte:fragment slot="meta">Select all participant ZIP files to evaluate.</svelte:fragment>
			</FileDropzone>

			<SelectedFileList bind:files={files} />
			<section class="w-full flex justify-end items-end">
				<button type="submit" class="btn variant-filled-primary p-2" disabled={!filesUploaded}>
					<span>Start Processing</span>
				</button>
			</section>
		</div>
</form>
