import { browser } from "$app/environment";
import { writable } from "svelte/store";
import { STUDY_TYPES } from "../constants";

interface StudyProperties {
  studyName: string;
  numDays: number;
  numSamples: number;
  samplePrefix: string;
  readParticipantsFromFile: boolean;
  numParticipants: number;
  participantColumn: string;
  participantPrefix: string;
  participantList: string[];
  hasEveningSample: boolean;
  startSampleFromZero: boolean;
  studyType: number;
}

interface BarcodeProperties {
  generateBarcodes: boolean;
  hasBarcode: boolean;
  addName: boolean;
  printBarcodeValue: boolean;
  useLetterFormat: boolean;
  numCols: number, 
  numRows: number, 
  leftMargin: number, 
  rightMargin: number, 
  topMargin: number, 
  bottomMargin: number, 
  colDist: number, 
  rowDist: number
}

interface QrCodeProperties {
  generateQrCodes: boolean;
  numSampleAlarmTimes: number;
  salivaDistances: number[];
  salivaAlarmTimes: string[];
  contact: string;
  includeStudyName: boolean;
  includeParticipantId: boolean;
  checkDuplicates: boolean;
  enableManualScan: boolean;
  useLetterFormat: boolean;
  numColumns: number,
  numRows: number,
}

let storedStudyProps;
let storedBarcodeProps;
let storedQrCodeProps;

if (browser) {
  // Fetch the data from the local storage
  storedStudyProps = localStorage.storedStudyProps;
  storedBarcodeProps = localStorage.storedBarcodeProps;
  storedQrCodeProps = localStorage.storedQrCodeProps;
}

// Create the base stores for each data type
const defaultStudyProps: StudyProperties = { studyName: 'Test', numDays: 1, numSamples: 2, samplePrefix: "S", readParticipantsFromFile: false, numParticipants: 1, participantList: [], participantColumn: 'participant', participantPrefix: 'VP_', hasEveningSample: false, startSampleFromZero: false, studyType: STUDY_TYPES[0] }
const defaultBarcodeProps: BarcodeProperties = { generateBarcodes: true, hasBarcode: false, addName: false, printBarcodeValue: false, useLetterFormat: false, numCols: 4, numRows: 12, leftMargin: 9.8, rightMargin: 9.8, topMargin: 21.2, bottomMargin: 21.2, colDist: 2.5, rowDist: 0 }
const defaultQrCodeProps: QrCodeProperties = { generateQrCodes: true, numSampleAlarmTimes: 0, salivaDistances: [], salivaAlarmTimes: [], contact: '', includeStudyName: false, includeParticipantId: false, checkDuplicates: false, enableManualScan: false, useLetterFormat: false, numColumns: 3, numRows: 6 }

// Create the stores
export const studyProps = storedStudyProps ? writable<StudyProperties>(addMissingProperties(JSON.parse(storedStudyProps), defaultStudyProps)) : writable<StudyProperties>(defaultStudyProps);
export const barcodeProps = storedBarcodeProps
  ? writable<BarcodeProperties>({
      ...addMissingProperties(JSON.parse(storedBarcodeProps), defaultBarcodeProps),
      generateBarcodes: true
    })
  : writable<BarcodeProperties>(defaultBarcodeProps);
export const qrCodeProps = storedQrCodeProps ? writable<QrCodeProperties>(addMissingProperties(JSON.parse(storedQrCodeProps), defaultQrCodeProps)) : writable<QrCodeProperties>(defaultQrCodeProps);

export const studyPropsValid = writable(Boolean(storedStudyProps));
export const barcodePropsValid = writable(Boolean(storedBarcodeProps));
export const qrCodePropsValid = writable(Boolean(storedQrCodeProps));
export const qrCodeSubmitAttempted = writable(false);
export const preparationCurrentStep = writable(1);

if (browser) {
  // Update the local storage when the store changes
  studyProps.subscribe((value) => {
    localStorage.storedStudyProps = JSON.stringify(value);
  });
  barcodeProps.subscribe((value) => {
    localStorage.storedBarcodeProps = JSON.stringify(value);
  });
  qrCodeProps.subscribe((value) => {
    localStorage.storedQrCodeProps = JSON.stringify(value);
  });
}

function addMissingProperties(storedValues, defaultValues) {
  for (const key in defaultValues) {
    if (!(key in storedValues) || storedValues[key] === undefined || storedValues[key] === null) {
      storedValues[key] = defaultValues[key];
    }
  }
  return storedValues;
}
