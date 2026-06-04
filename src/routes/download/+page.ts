import {
    barcodeProps,
    barcodePropsValid,
    qrCodeProps,
    qrCodePropsValid,
    studyPropsValid
} from '$lib/stores/configStore';
import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const ssr = false;

export const load = (async () => {
    const barcodesReady = get(barcodeProps).generateBarcodes && get(barcodePropsValid);
    const qrCodesReady = get(qrCodeProps).generateQrCodes && get(qrCodePropsValid);

    if (!get(studyPropsValid) || (!barcodesReady && !qrCodesReady)) {
        throw redirect(302, `${base}/study-configuration`);
    }
    return {};
}) satisfies PageLoad;
