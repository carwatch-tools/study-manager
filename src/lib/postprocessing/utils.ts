import JSZip, { type JSZipObject } from 'jszip';

type ZipEntryContent = {
	name: string;
	data: string[][];
};

export async function extractZip(files: FileList): Promise<ZipEntryContent[]> {
	const zip = new JSZip();
	const zipData: ZipEntryContent[] = [];
	const loadedFiles: string[] = [];

	// iterate over individual zip files
	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		// load the zip file
		const arrayBuffer = await readFileAsArrayBuffer(file);
		const loadedZip = await zip.loadAsync(arrayBuffer);

		// read filenames contained in archive
		const fileNames = readContentFileNames(loadedZip, loadedFiles);
		// sort file names alphabetically => participant names and dates are ordered
		fileNames.sort();

		// collect content from all files
		await Promise.allSettled(
			fileNames.map(async (fileName) => {
				const file = loadedZip.file(fileName);
				if (file) {
					loadedFiles.push(fileName);
					const zipEntryContent = await loadIndividualFileContent(file, fileName);
					zipData.push(zipEntryContent);
				}
			})
		);
	}

	if (zipData.length === 0) {
		throw new Error('No valid log files found in zip archive.');
	}

	return zipData;
}

function readContentFileNames(loadedZip: JSZip, loadedFileNames: string[]): string[] {
	// read filenames contained in archive
	const fileNames: string[] = [];
	loadedZip.forEach((_, zipEntry) => {
		if (!zipEntry.dir && !loadedFileNames.includes(zipEntry.name) && isCsvLogFile(zipEntry.name)) {
			fileNames.push(zipEntry.name);
		}
	});
	return fileNames;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return file.arrayBuffer();
}

async function loadIndividualFileContent(
	file: JSZipObject,
	fileName: string
): Promise<ZipEntryContent> {
	// parse csv file content; some app versions pretty-print JSON payloads across multiple lines
	const fileContent = await file.async('string');
	return {
		name: fileName,
		data: parseLogFileContent(fileContent)
	};
}

export function parseLogFileContent(fileContent: string): string[][] {
	const parsedEntries: string[][] = [];
	let currentEntry = '';

	fileContent.split(/\r?\n/).forEach((line) => {
		if (startsNewLogEntry(line)) {
			if (currentEntry !== '') {
				parsedEntries.push(splitLogEntry(currentEntry));
			}
			currentEntry = line;
		} else if (currentEntry !== '') {
			currentEntry += '\n' + line;
		}
	});

	if (currentEntry !== '') {
		parsedEntries.push(splitLogEntry(currentEntry));
	}

	return parsedEntries;
}

function startsNewLogEntry(line: string): boolean {
	return /^\d+;/.test(line);
}

function splitLogEntry(entry: string): string[] {
	const [unixTime, localTime, messageKey, ...payload] = entry.split(';');

	if (payload.length === 0) {
		return [unixTime, localTime, messageKey];
	}

	return [unixTime, localTime, messageKey, payload.join(';')];
}

function isCsvLogFile(fileName: string): boolean {
	const basename = getBaseName(fileName);
	return (
		basename.toLowerCase().endsWith('.csv') &&
		!basename.startsWith('.') &&
		!basename.startsWith('._') &&
		!fileName.includes('__MACOSX/')
	);
}

export function objectIsEmpty(obj: any): boolean {
	// check if object is empty
	return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function unixTimeToLocalTime(unixTime: number): string {
	// convert unix time to local time
	const date = new Date(unixTime); // uses time zone of browser
	const hours = '0' + date.getHours();
	const minutes = '0' + date.getMinutes();
	const seconds = '0' + date.getSeconds();
	const formattedTime =
		hours.substring(hours.length - 2, hours.length) +
		':' +
		minutes.substring(minutes.length - 2, minutes.length) +
		':' +
		seconds.substring(seconds.length - 2, seconds.length);
	return formattedTime;
}

export function getDateFromFileName(fileName: string, dayData: string[][] = []): string {
	return splitLogFileName(fileName, dayData).date;
}

export function getStudyFromFileName(fileName: string): string {
	return splitLogFileName(fileName).study;
}

export function getParticipantFromFileName(fileName: string): string {
	// extract participant name from filename, requires filename to be in format "carwatch_{studyName}_{participantName}_yyyymmdd.csv"
	return splitLogFileName(fileName).participant;
}

function splitLogFileName(
	fileName: string,
	dayData: string[][] = []
): { date: string; study: string; participant: string } {
	let date = '';
	let study = '';
	let participant = '';

	const basename = removeCsvExtension(getBaseName(fileName)).replace('carwatch_', '');
	const infoArray = basename.split('_');
	const dateString = infoArray[infoArray.length - 1];
	const hasFormattedDate = isDateToken(dateString);

	if (hasFormattedDate && infoArray.length > 2) {
		participant = infoArray.slice(1, -1).join('_');
		study = infoArray[0];
	} else if (infoArray.length > 1) {
		study = infoArray[0];
		participant = infoArray.slice(1).join('_');
	} else {
		participant = basename;
	}

	date = hasFormattedDate ? dateTokenToDate(dateString) : getDateFromLogData(dayData);

	return { date, study, participant };
}

function getBaseName(fileName: string): string {
	const normalized = fileName.replace(/\\/g, '/');
	return normalized.split('/').pop() ?? fileName;
}

function removeCsvExtension(fileName: string): string {
	return fileName.replace(/\.csv$/i, '');
}

function isDateToken(dateString: string): boolean {
	return /^\d{8}$/.test(dateString);
}

function dateTokenToDate(dateString: string): string {
	const year = dateString.slice(0, 4);
	const month = dateString.slice(4, 6);
	const day = dateString.slice(6, 8);
	return year + '-' + month + '-' + day;
}

function getDateFromLogData(dayData: string[][]): string {
	const firstUnixTimestamp = dayData.find((entry) => entry.length > 0)?.[0];
	const parsedTimestamp = Number(firstUnixTimestamp);
	if (!Number.isFinite(parsedTimestamp)) {
		return '';
	}

	const date = new Date(parsedTimestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return year + '-' + month + '-' + day;
}
