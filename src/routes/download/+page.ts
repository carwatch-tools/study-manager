import { barcodePropsValid, qrCodePropsValid, studyPropsValid } from '$lib/stores/configStore';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
    if (!(studyPropsValid && barcodePropsValid && qrCodePropsValid)) {
        throw redirect(302, '/study-configuration');
    }
    return {};
}) satisfies PageLoad;
