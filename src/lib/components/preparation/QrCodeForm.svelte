<script lang="ts">
	import {
		FIELD_STUDY,
		DEFAULT_SALIVA_DISTANCE,
		DEFAULT_SALIVA_TIME,
		DEFAULT_NUM_SAMPLE_ALARM_TIMES,
		OTHER_STUDY,
		PAPER_FORMAT_OPTIONS,
		PAPER_FORMAT_A4,
		PAPER_FORMAT_LETTER
	} from "$lib/constants";
	import { studyProps, qrCodeProps, qrCodePropsValid, qrCodeSubmitAttempted } from '$lib/stores/configStore';
	import { Step, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { onMount, afterUpdate } from 'svelte';

	let uniformSalivaDistances = true;
	let uniformSalivaDistance = DEFAULT_SALIVA_DISTANCE;
	let numSampleAlarmTimes = DEFAULT_NUM_SAMPLE_ALARM_TIMES;
	let salivaDistances: number[];
	let salivaTimes: string[];
	let previousStudyType: number | null = null;

	onMount(() => {
		if ($studyProps.studyType === FIELD_STUDY) {
			qrCodeProps.update((props) => {
				return {
					...props,
					generateQrCodes: true
				};
			});
		}
		initializeSalivaTimes();
		qrCodePropsValid.set(isValid());
		previousStudyType = $studyProps.studyType;
	});
	afterUpdate(() => qrCodePropsValid.set(isValid()));

	// every time the store value changes, check if input is valid
	$: $qrCodeProps, qrCodePropsValid.set(isValid());
	$: if ($studyProps.studyType !== previousStudyType) {
		if ($studyProps.studyType === FIELD_STUDY) {
			qrCodeProps.update((props) => {
				return {
					...props,
					generateQrCodes: true
				};
			});
		}
		previousStudyType = $studyProps.studyType;
	}

	// every time saliva distance is modified, check if input is valid
	$: uniformSalivaDistance, qrCodePropsValid.set(isValid());

	// every time the number of samples with fixed alarm times changes, regenerate saliva times array
	$: numSampleAlarmTimes, qrCodePropsValid.set(isValid());
	$: if ($qrCodePropsValid && $qrCodeSubmitAttempted) {
		qrCodeSubmitAttempted.set(false);
	}

	// every time the number of samples changes, regenerate saliva times array
	$: $studyProps.numSamples, initializeSalivaTimes();

	function initializeSalivaTimes() {
		if (!$qrCodeProps.salivaDistances || $qrCodeProps.salivaDistances.length != $studyProps.numSamples) {
			salivaDistances = [...Array(Math.floor(Number($studyProps.numSamples)))].fill(DEFAULT_SALIVA_DISTANCE);
			salivaDistances[0] = 0;
			uniformSalivaDistances = true;
		} else {
			// use values from storage
			salivaDistances = $qrCodeProps.salivaDistances;
		}
		if (!$qrCodeProps.salivaAlarmTimes || $qrCodeProps.salivaAlarmTimes.length != $studyProps.numSamples) {
			salivaTimes = [...Array(Math.floor(Number($studyProps.numSamples)))].fill(DEFAULT_SALIVA_TIME);
			// use values from storage
		} else {
			salivaTimes = $qrCodeProps.salivaAlarmTimes;
		}
		if ($qrCodeProps.numSampleAlarmTimes && $qrCodeProps.numSampleAlarmTimes <= $studyProps.numSamples) {
			numSampleAlarmTimes = $qrCodeProps.numSampleAlarmTimes;
			uniformSalivaDistances = false;
		}
	}

	function getValidationIssues() {
		const issues: { field: string; message: string }[] = [];

		if (!$qrCodeProps.generateQrCodes) {
			return issues;
		}

		const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($qrCodeProps.contact);
		if (!hasValidEmail) {
			issues.push({
				field: "contact",
				message: "Enter a valid Email address."
			});
		}

		if (!Number.isInteger(Number($qrCodeProps.numColumns)) || Number($qrCodeProps.numColumns) < 1 || Number($qrCodeProps.numColumns) > 5) {
			issues.push({
				field: "columns",
				message: "Number of columns must be between 1 and 5."
			});
		}

		if (!Number.isInteger(Number($qrCodeProps.numRows)) || Number($qrCodeProps.numRows) < 1 || Number($qrCodeProps.numRows) > getMaxQrRows()) {
			issues.push({
				field: "rows",
				message: `Number of rows must be between 1 and ${getMaxQrRows()}.`
			});
		}

		if (uniformSalivaDistances) {
			if (!Number.isFinite(Number(uniformSalivaDistance)) || Number(uniformSalivaDistance) < 1 || Number(uniformSalivaDistance) > 99) {
				issues.push({
					field: "distances",
					message: "Time between all samples must be between 1 and 99 minutes."
				});
			}
		} else {
			if (!Number.isInteger(Number(numSampleAlarmTimes)) || Number(numSampleAlarmTimes) < 0 || Number(numSampleAlarmTimes) > Number($studyProps.numSamples)) {
				issues.push({
					field: "samplesAbsTime",
					message: "The number of fixed-time samples is out of range."
				});
			}

			for (let i = 0; i < $studyProps.numSamples - numSampleAlarmTimes; i++) {
				if (!Number.isFinite(Number(salivaDistances[i]))) {
					issues.push({
						field: `distance${i}`,
						message: `Check the interval before sample ${i + Number(!$studyProps.startSampleFromZero)}.`
					});
				}
			}

			for (let i = 0; i < numSampleAlarmTimes; i++) {
				if (!salivaTimes[i]) {
					issues.push({
						field: `time${i}`,
						message: `Check the fixed alarm time for sample ${$studyProps.numSamples - numSampleAlarmTimes + i + Number(!$studyProps.startSampleFromZero)}.`
					});
				}
			}
		}

		return issues;
	}

	function isValid() {
		if (getValidationIssues().length > 0) {
			return false;
		}

		if (salivaDistances || salivaTimes) {
			submitQrCodeProps();
		}
		return true;
	}

	function hasValidationError(field: string) {
		return $qrCodeSubmitAttempted && getValidationIssues().some((issue) => issue.field === field);
	}

	function salivaListChanged() {
		qrCodePropsValid.set(isValid());
	}

	const submitQrCodeProps = () => {
		if (uniformSalivaDistances) {
			salivaDistances = salivaDistances.fill(uniformSalivaDistance)
			salivaDistances[0] = 0;  // first sample has to be taken immediately after waking up
			numSampleAlarmTimes = 0;
		}
		qrCodeProps.update((props) => {
			return {
				...props,
				numSampleAlarmTimes: numSampleAlarmTimes,
				salivaDistances: salivaDistances,
				salivaAlarmTimes: salivaTimes,
			};
		});
	};

	const checkMaxQrRows = (options?: { includeParticipantId?: boolean; useLetterFormat?: boolean }) => {
		const includeParticipantId = options?.includeParticipantId ?? $qrCodeProps.includeParticipantId;
		const useLetterFormat = options?.useLetterFormat ?? $qrCodeProps.useLetterFormat;
		const maxRows = getMaxQrRows(includeParticipantId, useLetterFormat);

		if ($qrCodeProps.numRows > maxRows) {
			const rows = maxRows;
			const durationSec = 7;
			qrCodeProps.update((props) => {
				return {
					...props,
					numRows: rows
				};
			});
			const t : ToastSettings = {
				message: `The number of rows was changed to ${rows} to match the selected QR code layout.`,
				timeout: durationSec * 1000,
			};
			toastStore.trigger(t);
		}
	};

	const getMaxQrRows = (includeParticipantId = $qrCodeProps.includeParticipantId, useLetterFormat = $qrCodeProps.useLetterFormat) => {
		return includeParticipantId ? 5 : useLetterFormat ? 6 : 7;
	};

	function handleSamplingModeChange(e: Event) {
		const target = e.currentTarget as HTMLSelectElement;
		uniformSalivaDistances = target.value === 'equal';
	}

	function handlePaperLayoutChange(e: Event) {
		const target = e.currentTarget as HTMLSelectElement;
		const useLetterFormat = target.value === PAPER_FORMAT_LETTER;
		const maxRows = getMaxQrRows($qrCodeProps.includeParticipantId, useLetterFormat);

		qrCodeProps.update((props) => {
			return {
				...props,
				useLetterFormat,
				numRows: Math.min(props.numRows, maxRows)
			};
		});
		checkMaxQrRows({ useLetterFormat });
	}

</script>

{#if $studyProps.studyType === FIELD_STUDY || $studyProps.studyType === OTHER_STUDY}
	<Step locked={false}>
		<svelte:fragment slot="header">QR Code Details</svelte:fragment>
		<form id="qr_code_form">
			<p class="mb-4 text-sm opacity-70">
				QR codes can be used to transfer study settings directly into the CARWatch app, so participants or study staff do not need to configure schedules and options manually.
			</p>
			<label class="label">
				<input class="checkbox" type="checkbox" bind:checked={$qrCodeProps.generateQrCodes} />
				Generate QR codes for study
			</label>

			<hr class="my-4">
			
			{#if $qrCodeProps.generateQrCodes}
				<label class="label md:w-1/3">
					<span>Email</span>
					<input class="input {hasValidationError('contact') ? 'border-error-500' : ''}" id="mail" type="email" bind:value={$qrCodeProps.contact} aria-invalid={hasValidationError('contact')} required />
					<p class="text-sm opacity-70">This address will be used to pre-fill the sharing form of the log files in the CARWatch app.</p>
				</label>

				<hr class="my-4">

				<div class="space-y-2">
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={$qrCodeProps.includeStudyName} />
						<p>Include study name on QR code labels</p>
						<p class="text-sm opacity-70">Places the study name at the top of each printed QR code label.</p>
					</label>
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={$qrCodeProps.includeParticipantId} on:change={checkMaxQrRows} />
						<p>Include participant IDs in QR codes</p>
						<p class="text-sm opacity-70">Creates participant-specific QR codes instead of one shared study setup code.</p>
					</label>
					<label class="flex items-center space-x-2">
						<input class="checkbox" type="checkbox" bind:checked={$qrCodeProps.checkDuplicates} />
						<p>Enable check for duplicate barcode scanning</p>
						<p class="text-sm opacity-70">If enabled, scanning the same barcode in the app twice will result in error message.</p>
					</label>

					{#if $studyProps.numSamples > 1}
						<hr class="my-4">
						<h4>Configure sampling reminders</h4>

						<label class="label md:w-1/3">
							<span>Sampling schedule</span><p class="text-sm opacity-70">Specify how sample reminders are scheduled</p>
							<select
								class="select"
								value={uniformSalivaDistances ? 'equal' : 'custom'}
								on:change={handleSamplingModeChange}
							>
								<option value="equal">Evenly spaced</option>
								<option value="custom">Flexible</option>
							</select>
						</label>

						<p class="text-sm opacity-70">
							Use <b>Evenly spaced</b> when all samples follow the same interval.
						</p>
						<p class="text-sm opacity-70">
							Choose <b>Flexible</b> when intervals vary or when some samples should be taken at fixed clock times (potentially relevant for diurnal rhythm studies).
						</p>
					{/if}
				</div>

				{#if !uniformSalivaDistances}
					<label class="label">
						<span>Number of samples that should be taken at a fixed time</span>
						<input
							class="input {hasValidationError('samplesAbsTime') ? 'border-error-500' : ''}"
							id="samplesAbsTime"
							style="width: 8rem;"
							type="number"
							bind:value={numSampleAlarmTimes}
							aria-invalid={hasValidationError('samplesAbsTime')}
							min="0"
							max="{$studyProps.numSamples}"
							required />
					</label>
					
				{/if}

				
					{#if uniformSalivaDistances}
						<div class="mt-4 h-full max-h-72 py-2 p overflow-y-auto overflow-x-hidden flex flex-col flex-grow px-4">
							<label class="label pb-1" for="distances"><span>Time between all samples</span></label>
							<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]" style="width: 15rem;">
								<input
									class="input col-span-2 {hasValidationError('distances') ? 'border-error-500' : ''}"
									id="distances"
									type="number"
									bind:value={uniformSalivaDistance}
									aria-invalid={hasValidationError('distances')}
									min="1"
									max="99"
									step="1"
									required/>
								<div class="input-group-shim col-span-1">min</div>
							</div>
						</div>
					{:else}
						<div class="mt-4 h-full py-2 overflow-y-auto overflow-x-hidden flex flex-col flex-grow px-4">
							{#each Array($studyProps.numSamples - numSampleAlarmTimes) as _, i}
								<label class="label pt-2 pb-1" for="distance{i}">
									{#if i === 0}
										<span>Time span between wake-up and sample {i + Number(!$studyProps.startSampleFromZero)}</span>
									{:else}
										<span>Time span between sample {i + Number(!$studyProps.startSampleFromZero) - 1} and sample {i + Number(!$studyProps.startSampleFromZero)}</span>
									{/if}
								</label>
								<div class="input-group input-group-divider grid-cols-[auto_2fr_auto]" style="width: 15rem;">
									<input
										class="input col-span-2 {hasValidationError(`distance${i}`) ? 'border-error-500' : ''}"
										id="distance{i}"
										type="number"
										bind:value={salivaDistances[i]}
										aria-invalid={hasValidationError(`distance${i}`)}
										on:input={salivaListChanged}
										required />
									<div class="input-group-shim">min</div>
								</div>
							{/each}
							{#each Array(numSampleAlarmTimes) as _, i}
								<label class="label pt-2 pb-1" for="time{i}">
									<span>
										Alarm time for sample {$studyProps.numSamples - numSampleAlarmTimes + i + Number(!$studyProps.startSampleFromZero)}
									</span>
								</label>
								<div class="input-group input-group-divider grid-cols-[auto_2fr_auto]" style="width: 15rem;">
									<input
										class="input col-span-2 {hasValidationError(`time${i}`) ? 'border-error-500' : ''}"
										id="time{i}"
										type="time"
										bind:value={salivaTimes[i]}
										aria-invalid={hasValidationError(`time${i}`)}
										on:input={salivaListChanged}
										required />
								</div>
							{/each}
						</div>
					{/if}
				<hr class="my-4">
				<h4>Print layout</h4>
				<label class="label md:w-1/3 my-3">
					<span>Paper layout</span>
					<select
						class="select"
						id="use_letter_format"
						value={$qrCodeProps.useLetterFormat ? PAPER_FORMAT_LETTER : PAPER_FORMAT_A4}
						on:change={handlePaperLayoutChange}
					>
						{#each PAPER_FORMAT_OPTIONS as format}
							<option value={format.id}>{format.label}</option>
						{/each}
					</select>
				</label>
				<div class="flex">
					<label class="label w-1/6">
						<span>Number of columns</span>
						<input
							bind:value={$qrCodeProps.numColumns}
							id="columns"
							class="input {hasValidationError('columns') ? 'border-error-500' : ''}"
							type="number"
							aria-invalid={hasValidationError('columns')}
							min="1" max="5"
							required
						/>
					</label>
					<label class="label w-1/6 mx-6">
						<span>Number of rows</span>
						<input
							bind:value={$qrCodeProps.numRows}
							id="rows"
							class="input {hasValidationError('rows') ? 'border-error-500' : ''}"
							type="number"
							aria-invalid={hasValidationError('rows')}
							min="1"
							max="{$qrCodeProps.includeParticipantId ? 5 : $qrCodeProps.useLetterFormat ? 6 : 7}"
							required
						/>
					</label>
				</div>

				{#if $qrCodeSubmitAttempted && getValidationIssues().length > 0}
					<div class="mt-4 rounded-container-token border border-error-500/40 bg-error-500/10 p-4 text-sm">
						<p class="font-medium">Please fix the following fields before continuing:</p>
						<ul class="mt-2 list-disc pl-5">
							{#each getValidationIssues() as issue}
								<li>{issue.message}</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
		</form>
	</Step>
{/if}
