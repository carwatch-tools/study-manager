# Playwright Tests

These tests formalize the printable barcode label checks used while fixing label generation.

Run them with:

```sh
npm test
```

On a machine without Playwright-managed browsers installed, point Playwright at a local Chromium-compatible browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

The barcode label suite covers:

- Barcode-only material generation when QR codes are disabled.
- Barcode label rendering with barcode values enabled.
- Text-only labels preserving minimum padding without placeholder SVGs.
- Long text-only labels shrinking to fit within the padded content area.

Playwright starts the app on `127.0.0.1:4174` by default. Override the port with:

```sh
PLAYWRIGHT_PORT=4180 npm test
```
