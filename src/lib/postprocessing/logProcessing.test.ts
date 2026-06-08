import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { collectData, dataToWideFormat } from './logCleaning';
import {
	extractZip,
	getDateFromFileName,
	getParticipantFromFileName,
	getStudyFromFileName,
	parseLogFileContent
} from './utils';

const multilineLogContent = `1776429093567;Fri Apr 17 2026 2:31:33 pm GMT+02:00;spontaneous_awakening;{
  "id" : -1
}
1776429099447;Fri Apr 17 2026 2:31:39 pm GMT+02:00;barcode_scanned;{
  "day_scanned" : 1,
  "saliva_id" : 101,
  "barcode_value" : "0010101",
  "day_expected" : 1,
  "id" : 0,
  "sample_scanned" : "S1",
  "sample_expected" : "S1"
}
1776429099453;Fri Apr 17 2026 2:31:39 pm GMT+02:00;alarm_cancel;{
  "id" : 0
}`;

const singleLineLogContent =
	'1776427509700;Fri Apr 17 2026 2:05:09 pm GMT+02:00;barcode_scanned;{"saliva_id":101,"day_expected":1,"id":0,"barcode_value":"0010101","sample_scanned":"S1","sample_expected":"S1","day_scanned":1}';

const attachedExampleZip = readFileSync(
	new URL('./fixtures/carwatch_logs_01.csv.zip', import.meta.url)
);

function attachedExampleFile(): File {
	const arrayBuffer = attachedExampleZip.buffer.slice(
		attachedExampleZip.byteOffset,
		attachedExampleZip.byteOffset + attachedExampleZip.byteLength
	) as ArrayBuffer;

	return new File([arrayBuffer], 'carwatch_logs_01.csv.zip', { type: 'application/zip' });
}

async function extractAttachedExampleFixture() {
	const extracted = await extractZip([attachedExampleFile()] as unknown as FileList);
	return extracted[0];
}

describe('log file processing', () => {
	it('parses multiline JSON payloads into logical log entries', () => {
		const parsedEntries = parseLogFileContent(multilineLogContent);

		expect(parsedEntries).toHaveLength(3);
		expect(parsedEntries[1][2]).toBe('barcode_scanned');
		expect(parsedEntries[1][3]).toContain('"barcode_value" : "0010101"');
		expect(() => JSON.parse(parsedEntries[1][3])).not.toThrow();
	});

	it('keeps legacy single-line payloads parseable', () => {
		const parsedEntries = parseLogFileContent(singleLineLogContent);

		expect(parsedEntries).toEqual([
			[
				'1776427509700',
				'Fri Apr 17 2026 2:05:09 pm GMT+02:00',
				'barcode_scanned',
				'{"saliva_id":101,"day_expected":1,"id":0,"barcode_value":"0010101","sample_scanned":"S1","sample_expected":"S1","day_scanned":1}'
			]
		]);
	});

	it('extracts awakening and sampling data from parsed multiline logs', () => {
		const parsedEntries = parseLogFileContent(multilineLogContent);
		const collectedData = collectData(parsedEntries);

		expect(collectedData.awakening_info.awakening_type).toBe('self-report');
		expect(collectedData.sample_count).toBe(1);
		expect(collectedData.sampling_info).toEqual([
			{
				saliva_id: 'S1',
				sampling_time: expect.any(String),
				sample_barcode: '0010101'
			}
		]);
	});

	it('converts processed log data into a wide-format csv array', () => {
		const parsedEntries = parseLogFileContent(multilineLogContent);
		const csvArray = dataToWideFormat([
			{
				study: 'CARWatch Test',
				participant: 'VP_01',
				date: '2026-04-17',
				info: collectData(parsedEntries)
			}
		]);

		expect(csvArray[0]).toEqual([
			'Study Name',
			'Participant ID',
			'date_D1',
			'awakening_time_D1_app',
			'awakening_type_D1',
			'sampling_time_S1_D1',
			'sample_barcode_S1_D1'
		]);
		expect(csvArray[1][0]).toBe('CARWatch Test');
		expect(csvArray[1][1]).toBe('VP_01');
		expect(csvArray[1][2]).toBe('2026-04-17');
		expect(csvArray[1][4]).toBe('self-report');
		expect(csvArray[1][6]).toBe('0010101');
	});

	it('extracts sampling data from the attached single-file log example', async () => {
		const fixture = await extractAttachedExampleFixture();
		const collectedData = collectData(fixture.data);

		expect(fixture.data).toHaveLength(23);
		expect(collectedData.awakening_info.awakening_type).toBe('self-report');
		expect(collectedData.sample_count).toBe(4);
		expect(
			collectedData.sampling_info.map((sample: { saliva_id: string }) => sample.saliva_id)
		).toEqual(['B1', 'B2', 'B3', 'B4']);
		expect(
			collectedData.sampling_info.map((sample: { sample_barcode: string }) => sample.sample_barcode)
		).toEqual(['0010101', '0010102', '0010103', '0010104']);
	});

	it('derives fallback metadata for log files without a formatted date suffix', async () => {
		const fixture = await extractAttachedExampleFixture();

		expect(getStudyFromFileName('carwatch_logs_01.csv')).toBe('logs');
		expect(getParticipantFromFileName('carwatch_logs_01.csv')).toBe('01');
		expect(getDateFromFileName('carwatch_logs_01.csv', fixture.data)).toBe('2025-05-15');
	});

	it('keeps extracting metadata from formatted legacy log file names', () => {
		const fileName = 'carwatch_CARWatch Test_VP_01_20260417.csv';

		expect(getStudyFromFileName(fileName)).toBe('CARWatch Test');
		expect(getParticipantFromFileName(fileName)).toBe('VP_01');
		expect(getDateFromFileName(fileName)).toBe('2026-04-17');
	});

	it('includes csv files without formatted names when extracting zip archives', async () => {
		const extracted = await extractZip([attachedExampleFile()] as unknown as FileList);

		expect(extracted).toHaveLength(1);
		expect(extracted[0].name).toBe('carwatch_logs_01.csv');
		expect(extracted[0].data).toHaveLength(23);
	});
});
