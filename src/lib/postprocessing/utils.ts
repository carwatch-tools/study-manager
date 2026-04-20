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
        if (!zipEntry.dir && !loadedFileNames.includes(zipEntry.name) && nameIsValid(zipEntry.name)) {
            fileNames.push(zipEntry.name);
        }
    });
    return fileNames;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    // read zip archive as an ArrayBuffer
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(arrayBuffer);
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
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

function nameIsValid(fileName: string): boolean {
    // check if the current filename has the format "studyName_participantName_yyyymmdd.csv"

    // check if ending is ".csv"
    const csvSplit = fileName.split('.csv');
    if (csvSplit.length != 2) {
        return false;
    }
    if (csvSplit[csvSplit.length - 1] != '') {
        return false;
    }

    const basename = fileName.split('.csv')[0];

    // check if enough "_" are present
    if (basename.split('_').length < 3) {
        return false;
    }

    // check if date is valid
    const dateString = basename.split('_')[basename.split('_').length - 1];
    // check if dateString is a number
    if (isNaN(parseFloat(dateString))) {
        return false;
    }
    // check if dateString is an integer
    if (!Number.isInteger(parseFloat(dateString))) {
        return false;
    }
    // check if dateString has length 8
    if (dateString.length != 8) {
        return false;
    }
    return true;
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

export function getDateFromFileName(fileName: string): string {
    // extract date from filename, requires filename to be in format "studyName_participantName_yyyymmdd.csv"
    return splitLogFileName(fileName).date;
}

export function getStudyFromFileName(fileName: string): string {
    return splitLogFileName(fileName).study;
}

export function getParticipantFromFileName(fileName: string): string {
    // extract participant name from filename, requires filename to be in format "carwatch_{studyName}_{participantName}_yyyymmdd.csv"
    return splitLogFileName(fileName).participant;
}

function splitLogFileName(fileName: string): { date: string; study: string; participant: string } {
    let date = '';
    let study = '';
    let participant = '';

    let basename = fileName.split('.csv')[0];

    basename = basename.replace('carwatch_', '');
    basename = basename.split('\\')[basename.split('\\').length - 1];
    basename = basename.split('/')[basename.split('/').length - 1];
    const infoArray = basename.split('_');
    if (infoArray.length > 2) {
        participant = infoArray.slice(1, infoArray.length - 1).join('_');
        study = infoArray[0];
    }

    const dateString = basename.split('_')[basename.split('_').length - 1];
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    date = year + '-' + month + '-' + day;

    return { date, study, participant };
}
