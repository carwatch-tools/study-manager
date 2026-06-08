import { objectIsEmpty, unixTimeToLocalTime } from './utils';

const PROP_AWAKENING_TYPES: { [key: string]: string } = {
	spontaneous_awakening: 'self-report',
	alarm_stop: 'alarm'
};
const PROP_SAMPLING_TIME = 'barcode_scanned';
const PROP_RECORDED_AWAKENING_TIME = 'recorded_wake_up_time';

const PROP_EVENING_ID = 815;

const AWAKENING_TIME = 'awakening_time';
const AWAKENING_TYPE = 'awakening_type';
const AWAKENING_INFO = 'awakening_info';
const SAMPLING_TIME = 'sampling_time';
const SAMPLING_INFO = 'sampling_info';
const SAMPLING_COUNT = 'sample_count';
const SAMPLE_BARCODE = 'sample_barcode';
const SAMPLE_SCANNED = 'sample_scanned';
const SALIVA_ID = 'saliva_id';

const COL_UNIX_TIME = 0;
const DEFAULT_MSG_KEY_COL = 2;
const DEFAULT_DATA_COL = 2;

export function collectData(dayData: Array<any>): { [key: string]: any } {
	// collect awakening and sampling info
	// scan dayData for awakening and sampling info and return object containing of the extracted respective info
	let result: { [key: string]: any } = {};
	let awakening = extractAwakeningInfo(dayData);
	let sampling = extractSamplingTimes(dayData);
	if (!objectIsEmpty(awakening)) {
		result[AWAKENING_INFO] = awakening;
	}
	if (!objectIsEmpty(sampling.result)) {
		result[SAMPLING_INFO] = sampling.result;
		result[SAMPLING_COUNT] = sampling.sample_count;
	}
	return result;
}

export function extractAwakeningInfo(dayData: Array<any>) {
	// return object with properties awakening time and type
	// returns empty object if no suitable information contained in dayData
	let data = extractData(dayData, Object.keys(PROP_AWAKENING_TYPES));
	const colLogMsgKey = getMsgKeyCol(dayData);
	let googleFitAwakeningData = extractData(dayData, PROP_RECORDED_AWAKENING_TIME);
	let result: { [key: string]: any } = {};
	if (data.length > 0) {
		data = data[0];
	}
	let googleFitAwakening =
		googleFitAwakeningData.length > 0
			? unixTimeToLocalTime(+googleFitAwakeningData[0][COL_UNIX_TIME])
			: '';
	if (PROP_AWAKENING_TYPES.hasOwnProperty(data[colLogMsgKey])) {
		let type = PROP_AWAKENING_TYPES[data[colLogMsgKey]];
		let time = unixTimeToLocalTime(+data[COL_UNIX_TIME]);
		result = { awakening_time: time, awakening_type: type, google_fit: googleFitAwakening };
	}
	return result;
}

export function extractSamplingTimes(dayData: Array<any>) {
	// return result object with properties sampling time and sample id and total number of samples in dayData
	// returns empty object if no suitable information contained in dayData
	let samples = extractData(dayData, PROP_SAMPLING_TIME);
	let result: { [key: string]: any } = {};
	const dataCol = getDataCol(dayData);

	if (samples.length > 0) {
		let sampleIds: Array<string> = [];
		samples.sort((a, b) => +a[COL_UNIX_TIME] - +b[COL_UNIX_TIME]);
		result = samples.map((entry) => {
			const timestamp = unixTimeToLocalTime(+entry[COL_UNIX_TIME]);
			const json = JSON.parse(entry[dataCol]);
			let saliva_id = '';
			let sample_scanned = '';
			if (json.hasOwnProperty('sample_expected')) {
				// logs from newer app versions
				saliva_id = json.sample_expected;
				sample_scanned = json.sample_scanned ?? '';
			} else if (json.hasOwnProperty('saliva_id')) {
				// logs from older app versions
				saliva_id = 'S' + json.saliva_id;
				// check whether current sample is evening sample
				if (json.id === PROP_EVENING_ID) {
					saliva_id = 'SE';
				}
			}
			if (sampleIds.includes(saliva_id) || saliva_id === 'SM') {
				let mapped = sampleIds.map((e) => +e.slice(-1));
				let filtered = mapped.filter((e) => !isNaN(e));
				let maxIndex = Math.max(...mapped);
				if (maxIndex === -Infinity) maxIndex = 0;
				if (maxIndex) {
					saliva_id = saliva_id.slice(0, -1) + (maxIndex + 1);
				}
			}
			sampleIds.push(saliva_id);
			if (!sample_scanned) {
				sample_scanned = saliva_id;
			}

			return {
				saliva_id: saliva_id,
				sampling_time: timestamp,
				sample_barcode: json.barcode_value,
				sample_scanned
			};
		});
	}
	return { result: result, sample_count: samples.length };
}

export function dataToWideFormat(data: Array<any>): Array<any> {
	// transform collected data to pandas-style wide format
	// contains all days and samples per day in columns and all participants in rows
	let csvArray = [];

	// create header of csv file
	let dayCount = getMaxNumberOfDays(data);
	let sampleCount = getMaxNumberOfSamples(data);
	const includeGoogleFitSleep = hasGoogleFitData(data);
	csvArray.push(createHeader(dayCount, sampleCount.saliva_ids, includeGoogleFitSleep));

	// extract unique participants -> one row per participant
	let participantArray = extractUniqueParticipants(data);

	// create data rows
	participantArray.forEach((participant) => {
		csvArray.push(
			createParticipantRow(participant, data, sampleCount.saliva_ids, includeGoogleFitSleep)
		);
	});
	return csvArray;
}

function extractData(dayData: Array<any>, key: string | string[]): Array<any> {
	// extract data from dayData that matches key
	let result = [];
	const colLogMsgKey = getMsgKeyCol(dayData);
	if (typeof key === 'string') {
		result = dayData.filter((entry) => entry[colLogMsgKey] === key);
	} else if (Array.isArray(key) && key.length > 0) {
		result = dayData.filter((entry) => key.includes(entry[colLogMsgKey]));
	}
	return result;
}

function getMaxNumberOfDays(data: Array<any>): number {
	const participantCount: { [participant: string]: number } = {};
	// count number of days per participant
	data.forEach((entry) => {
		const participant = entry.participant;
		if (participant in participantCount) {
			participantCount[participant]++;
		} else {
			participantCount[participant] = 1;
		}
	});
	// get maximum number of days
	let maxCount = 0;
	for (const participant in participantCount) {
		const count = participantCount[participant];
		if (count > maxCount) {
			maxCount = count;
		}
	}
	return maxCount;
}

function getMaxNumberOfSamples(data: Array<any>): { maxCount: number; saliva_ids: Array<any> } {
	// get maximum number of samples per day from all participants
	// extract the corresponding saliva ids and use them as a reference
	let maxCount = 0;
	let saliva_ids: Array<any> = [];
	data.forEach((entry) => {
		const sampleCount = entry.info.sample_count;
		if (sampleCount > maxCount) {
			maxCount = sampleCount;
			saliva_ids = entry.info.sampling_info.map(
				(e: { saliva_id: any; sampling_time: string }) => e.saliva_id
			);
		}
	});
	return { maxCount: maxCount, saliva_ids: saliva_ids };
}

function hasGoogleFitData(data: Array<any>): boolean {
	return data.some((entry) => {
		if (entry.info.hasOwnProperty(AWAKENING_INFO)) {
			return entry.info.awakening_info.google_fit !== '';
		} else {
			return false;
		}
	});
}

function createHeader(
	dayCount: number,
	samples: Array<any>,
	withGoogleFit: boolean
): Array<string> {
	// create header for csv file
	let header: Array<string> = [];
	header.push('Study Name');
	header.push('Participant ID');
	for (let i = 1; i <= dayCount; i++) {
		header.push('date_D' + i);
		if (withGoogleFit) {
			header.push(AWAKENING_TIME + '_D' + i + '_google_fit');
		}
		header.push(AWAKENING_TIME + '_D' + i + '_app');
		header.push(AWAKENING_TYPE + '_D' + i);
		samples.forEach((sample) => {
			header.push(SAMPLING_TIME + '_D' + i + '_' + sample);
			header.push(`${SAMPLE_BARCODE}_D${i}_${sample}`);
			header.push(`${SAMPLE_SCANNED}_D${i}_${sample}`);
		});
	}
	return header;
}

function extractUniqueParticipants(data: Array<any>) {
	// extract unique participant ids from data
	let participantArray: Array<{ study: string; participant: string }> = [];
	data.forEach((entry) => {
		const part = { study: entry.study, participant: entry.participant };
		if (
			!participantArray.some((e) => e.participant === part.participant && e.study === part.study)
		) {
			participantArray.push(part);
		}
	});
	return participantArray.sort(
		(part1, part2) =>
			part1.study.localeCompare(part2.study) || part1.participant.localeCompare(part2.participant)
	);
}

function createParticipantRow(
	studyParticipant: { study: string; participant: string },
	data: Array<any>,
	saliva_ids: Array<any>,
	withGoogleFit: boolean
) {
	// concatenate all data for one participant in one row for the final csv array
	let row: Array<string> = [];
	const participant = studyParticipant.participant;
	const study = studyParticipant.study;
	row.push(study);
	row.push(participant);
	const relevantEntries = data.filter(
		(entry) => entry.participant === participant && entry.study === study
	);
	relevantEntries.forEach((entry) => {
		// add day
		row.push(entry.date);
		// add awakening time and type
		if (entry.info.hasOwnProperty(AWAKENING_INFO)) {
			const awakening_info = entry.info.awakening_info;
			if (withGoogleFit) {
				row.push(awakening_info.google_fit);
			}
			row.push(awakening_info.awakening_time);
			row.push(awakening_info.awakening_type);
		} else {
			const addRows = withGoogleFit ? 3 : 2;
			for (let i = 0; i < addRows; i++) {
				row.push('');
			}
		}
		// add sampling times
		if (entry.info.hasOwnProperty(SAMPLING_INFO)) {
			const sampling_info = entry.info.sampling_info;
			saliva_ids.forEach((saliva_id) => {
				const sample = sampling_info.find((e: { saliva_id: any }) => e.saliva_id === saliva_id);
				if (sample) {
					row.push(sample.sampling_time);
					row.push(sample.sample_barcode);
					row.push(sample.sample_scanned);
				} else {
					row.push('', '', '');
				}
			});
		} else {
			saliva_ids.forEach(() => {
				row.push('', '', '');
			});
		}
	});

	return row;
}

function getMsgKeyCol(data: Array<any>) {
	if (data.length === 0) {
		return DEFAULT_MSG_KEY_COL;
	}
	return data[0].length === 3 ? 1 : 2;
}

function getDataCol(data: Array<any>) {
	if (data.length === 0) {
		return DEFAULT_DATA_COL;
	}
	return data[0].length === 3 ? 2 : 3;
}
