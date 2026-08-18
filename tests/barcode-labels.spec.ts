import { expect, test, type Page } from '@playwright/test';

const barcodeLayout = {
	generateBarcodes: true,
	useLetterFormat: false,
	numCols: 4,
	numRows: 12,
	leftMargin: 9.8,
	rightMargin: 9.8,
	topMargin: 21.2,
	bottomMargin: 21.2,
	colDist: 2.5,
	rowDist: 0
};

const studyProps = {
	studyName: 'Test',
	numDays: 1,
	numSamples: 6,
	samplePrefix: 'S',
	readParticipantsFromFile: false,
	numParticipants: 8,
	participantColumn: 'participant',
	participantPrefix: 'VP_',
	participantList: ['VP_01', 'VP_02', 'VP_03', 'VP_04', 'VP_05', 'VP_06', 'VP_07', 'VP_08'],
	hasEveningSample: false,
	startSampleFromZero: true,
	studyType: 2
};

const qrCodesDisabled = {
	generateQrCodes: false,
	numSampleAlarmTimes: 0,
	salivaDistances: [],
	salivaAlarmTimes: [],
	contact: '',
	includeStudyName: false,
	includeParticipantId: false,
	checkDuplicates: false,
	enableManualScan: false,
	useLetterFormat: false,
	numColumns: 3,
	numRows: 6
};

function createCaptions(separator: '_' | '<br>' = '_') {
	return Array.from({ length: 48 }, (_, i) => {
		const participant = Math.floor(i / 6) + 1;
		const sample = i % 6;
		return `Test${separator}VP_${String(participant).padStart(2, '0')}_S${sample}`;
	});
}

function createLongCaptions() {
	return Array.from({ length: 48 }, (_, i) => {
		const participant = Math.floor(i / 6) + 1;
		const sample = i % 6;
		return `VeryLongStudyName<br>PARTICIPANT_${String(participant).padStart(
			2,
			'0'
		)}_SAMPLE_${sample}`;
	});
}

function createBarcodeData(length = 48) {
	return Array.from({ length }, (_, i) => {
		const participant = Math.floor(i / 6) + 1;
		const sample = i % 6;
		return `${String(participant).padStart(3, '0')}01${String(sample).padStart(2, '0')}`;
	});
}

async function seedPreparationStores(
	page: Page,
	options: { hasBarcode: boolean; printBarcodeValue?: boolean }
) {
	await page.addInitScript(
		({ hasBarcode, printBarcodeValue, study, barcode, qrCodes }) => {
			localStorage.setItem(
				'storedBarcodeProps',
				JSON.stringify({
					...barcode,
					hasBarcode,
					addName: true,
					printBarcodeValue
				})
			);
			localStorage.setItem('storedStudyProps', JSON.stringify(study));
			localStorage.setItem('storedQrCodeProps', JSON.stringify(qrCodes));
		},
		{
			hasBarcode: options.hasBarcode,
			printBarcodeValue: Boolean(options.printBarcodeValue),
			study: studyProps,
			barcode: barcodeLayout,
			qrCodes: qrCodesDisabled
		}
	);
}

async function seedBarcodePageStores(
	page: Page,
	options: { hasBarcode: boolean; printBarcodeValue?: boolean; captions: string[] }
) {
	await page.addInitScript(
		({ hasBarcode, printBarcodeValue, captions, data, barcode }) => {
			localStorage.setItem(
				'storedBarcodeProps',
				JSON.stringify({
					...barcode,
					hasBarcode,
					addName: true,
					printBarcodeValue
				})
			);
			localStorage.setItem('storedBarcodeDataArray', JSON.stringify(data));
			localStorage.setItem('storedCaptionArray', JSON.stringify(captions));
		},
		{
			hasBarcode: options.hasBarcode,
			printBarcodeValue: Boolean(options.printBarcodeValue),
			captions: options.captions,
			data: createBarcodeData(options.captions.length),
			barcode: barcodeLayout
		}
	);
}

test('barcode-only download is available when QR codes are disabled', async ({ page }) => {
	await seedPreparationStores(page, { hasBarcode: true });

	await page.goto('/download');

	await expect(page).toHaveURL(/\/download\/?$/);
	const barcodeButton = page.getByRole('button', { name: /get printable barcodes/i });
	await expect(barcodeButton).toBeVisible();
	await expect(page.getByRole('button', { name: /get printable qr codes/i })).toHaveCount(0);

	await barcodeButton.click();
	await expect(page).toHaveURL(/\/download\/barcodes\/?$/);
	await expect(page.locator('svg.barcode')).toHaveCount(48);
	await expect(page.locator('svg.barcode rect').first()).toBeVisible();
});

test('barcode labels render barcodes and barcode values inside label bounds', async ({ page }) => {
	await seedBarcodePageStores(page, {
		hasBarcode: true,
		printBarcodeValue: true,
		captions: createCaptions('_')
	});

	await page.goto('/download/barcodes');
	await page.waitForSelector('svg.barcode rect');

	const metrics = await page
		.locator('.label-barcode')
		.first()
		.evaluate((label) => {
			const labelRect = label.getBoundingClientRect();
			const svgRect = label.querySelector('svg.barcode')!.getBoundingClientRect();
			const valueRect = label.querySelector('.barcode-value')!.getBoundingClientRect();

			return {
				svgChildren: label.querySelector('svg.barcode')!.children.length,
				svgWithinLabel:
					svgRect.left >= labelRect.left &&
					svgRect.right <= labelRect.right &&
					svgRect.top >= labelRect.top &&
					svgRect.bottom <= labelRect.bottom,
				valueWithinLabel:
					valueRect.left >= labelRect.left &&
					valueRect.right <= labelRect.right &&
					valueRect.top >= labelRect.top &&
					valueRect.bottom <= labelRect.bottom
			};
		});

	expect(metrics.svgChildren).toBeGreaterThan(0);
	expect(metrics.svgWithinLabel).toBe(true);
	expect(metrics.valueWithinLabel).toBe(true);
});

test('empty placeholders preserve the label grid on a partially filled page', async ({ page }) => {
	await seedBarcodePageStores(page, {
		hasBarcode: true,
		captions: createCaptions('_').slice(0, 21)
	});

	await page.goto('/download/barcodes');
	await page.waitForSelector('svg.barcode rect');

	const metrics = await page.locator('.label').evaluateAll((labels) => {
		const rects = labels.map((label) => label.getBoundingClientRect());
		const first = rects[0];
		const firstPlaceholder = rects[21];
		const rowTops = Array.from({ length: 12 }, (_, row) => rects[row * 4].top);

		return {
			labelCount: labels.length,
			barcodeLabelCount: labels.filter((label) => label.classList.contains('label-barcode')).length,
			placeholderMatchesLabelSize:
				Math.abs(firstPlaceholder.width - first.width) < 0.1 &&
				Math.abs(firstPlaceholder.height - first.height) < 0.1,
			rowSteps: rowTops.slice(1).map((top, index) => top - rowTops[index])
		};
	});

	expect(metrics.labelCount).toBe(48);
	expect(metrics.barcodeLabelCount).toBe(21);
	expect(metrics.placeholderMatchesLabelSize).toBe(true);
	for (const rowStep of metrics.rowSteps) {
		expect(rowStep).toBeCloseTo(metrics.rowSteps[0], 1);
	}
});

test('text-only labels preserve minimum padding and do not render barcode placeholders', async ({
	page
}) => {
	await seedBarcodePageStores(page, {
		hasBarcode: false,
		captions: createCaptions('<br>')
	});

	await page.goto('/download/barcodes');
	await page.waitForSelector('.label-text-only');

	const metrics = await page
		.locator('.label-text-only')
		.first()
		.evaluate((label) => {
			const labelRect = label.getBoundingClientRect();
			const styles = getComputedStyle(label);
			const padding = Number.parseFloat(styles.paddingTop);
			const textRects = Array.from(label.querySelectorAll('p')).map((text) => {
				const rect = text.getBoundingClientRect();
				return {
					top: rect.top - labelRect.top,
					bottom: labelRect.bottom - rect.bottom,
					left: rect.left - labelRect.left,
					right: labelRect.right - rect.right
				};
			});

			return {
				padding,
				textCount: textRects.length,
				svgCount: label.querySelectorAll('svg').length,
				minInset: Math.min(
					...textRects.flatMap((rect) => [rect.top, rect.bottom, rect.left, rect.right])
				)
			};
		});

	expect(metrics.textCount).toBe(2);
	expect(metrics.svgCount).toBe(0);
	expect(metrics.padding).toBeGreaterThanOrEqual(10.5);
	expect(metrics.minInset).toBeGreaterThanOrEqual(10.5);
});

test('long text-only labels shrink to fit within the padded content area', async ({ page }) => {
	await seedBarcodePageStores(page, {
		hasBarcode: false,
		captions: createLongCaptions()
	});

	await page.goto('/download/barcodes');
	await page.waitForSelector('.label-text-only');

	const metrics = await page
		.locator('.label-text-only')
		.first()
		.evaluate((label) => {
			const labelRect = label.getBoundingClientRect();
			const styles = getComputedStyle(label);
			const paddingLeft = Number.parseFloat(styles.paddingLeft);
			const paddingRight = Number.parseFloat(styles.paddingRight);
			const availableWidth = label.clientWidth - paddingLeft - paddingRight;

			return Array.from(label.querySelectorAll('p')).map((text) => {
				const rect = text.getBoundingClientRect();
				return {
					fontSize: Number.parseFloat(getComputedStyle(text).fontSize),
					leftInset: rect.left - labelRect.left,
					rightInset: labelRect.right - rect.right,
					scrollWidth: text.scrollWidth,
					availableWidth
				};
			});
		});

	for (const text of metrics) {
		expect(text.fontSize).toBeLessThan(24);
		expect(text.leftInset).toBeGreaterThanOrEqual(10.5);
		expect(text.rightInset).toBeGreaterThanOrEqual(10.5);
		expect(text.scrollWidth).toBeLessThanOrEqual(text.availableWidth + 1);
	}
});
