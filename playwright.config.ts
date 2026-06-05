import type { PlaywrightTestConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4174);
const chromeExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const webServerCommand =
	process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? `npm run dev -- --host 127.0.0.1 --port ${port}`;

const config: PlaywrightTestConfig = {
	webServer: {
		command: webServerCommand,
		port,
		reuseExistingServer: false
	},
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		...(chromeExecutablePath
			? {
					launchOptions: {
						executablePath: chromeExecutablePath
					}
			  }
			: {})
	},
	testDir: 'tests'
};

export default config;
