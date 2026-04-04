/* constants for study configuration */

export const FIELD_STUDY = 1;
export const LAB_STUDY = 2;
export const OTHER_STUDY = 3;
export const STUDY_TYPES = [FIELD_STUDY, LAB_STUDY, OTHER_STUDY];
export const APP_OPTION: Record<number, boolean> = {
  [FIELD_STUDY]: true,
  [LAB_STUDY]: false,
  [OTHER_STUDY]: true
};
export const DEFAULT_SALIVA_DISTANCE = 15; 
export const DEFAULT_NUM_SAMPLE_ALARM_TIMES = 0;
export const DEFAULT_SALIVA_TIME = "12:00"
/* constants to create QR code data */
export const QR_PARSER_APP_ID = "CARWATCH";
export const QR_PARSER_SEPARATOR = ";";
export const QR_PARSER_SPECIFIER = ":";
export const QR_PARSER_LIST_SEPARATOR = ",";
export const QR_PARSER_PROPERTY_STUDY_NAME = "N";
export const QR_PARSER_PROPERTY_STUDY_DAYS = "D";
export const QR_PARSER_PROPERTY_NUM_PARTICIPANTS = "NP";
export const QR_PARSER_PROPERTY_PARTICIPANT_ID = "PID";
export const QR_PARSER_PROPERTY_SALIVA_TIMES = "T";
export const QR_PARSER_PROPERTY_SALIVA_ALARMS = "A";
export const QR_PARSER_PROPERTY_START_SAMPLE = "SS";
export const QR_PARSER_PROPERTY_EVENING = "E";
export const QR_PARSER_PROPERTY_CONTACT = "M";
export const QR_PARSER_PROPERTY_DUPLICATES = "FD";
export const QR_PARSER_PROPERTY_MANUAL_SCAN = "FM";
export const QR_PARSER_PROPERTY_WEB_APP_VERSION = "V";

export const FORBIDDEN_CHARACTERS = [QR_PARSER_LIST_SEPARATOR, QR_PARSER_SEPARATOR, QR_PARSER_SPECIFIER];

export const PAPER_FORMAT_A4 = "A4";
export const PAPER_FORMAT_LETTER = "letter";

export interface PaperFormatConfig {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PAPER_FORMATS: Record<string, PaperFormatConfig> = {
  [PAPER_FORMAT_A4]: {
    id: PAPER_FORMAT_A4,
    label: "DIN A4 (297 mm × 210 mm)",
    widthMm: 210,
    heightMm: 297
  },
  [PAPER_FORMAT_LETTER]: {
    id: PAPER_FORMAT_LETTER,
    label: "ANSI Letter (11 in × 8.5 in)",
    widthMm: 215.9,
    heightMm: 279.4
  }
};

export const PAPER_FORMAT_OPTIONS = [
  PAPER_FORMATS[PAPER_FORMAT_A4],
  PAPER_FORMATS[PAPER_FORMAT_LETTER]
];

export function getPreparationStepCount(studyType: number): number {
  return [
    true, // Study setup
    true, // Barcode setup
    APP_OPTION[studyType] // QR setup when supported for this study type
  ].filter(Boolean).length;
}
