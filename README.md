# Udemy Transcript & Caption Downloader

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Open-source Chrome extension (Manifest V3) to export video transcripts and subtitles from Udemy and Udemy Business in multiple text and subtitle formats.

[English](#features) • [Italiano (Guida in Italiano)](#guida-in-italiano)

---

## Features

- **Udemy & Udemy Business**: Works on both consumer accounts (`udemy.com`) and enterprise portals (`*.udemy.com`).
- **Multiple Export Formats**:
  - **Clean TXT**: Paragraphs with sentence-aware merging, stripping subtitle break artifacts.
  - **Timed TXT**: Line-by-line format with `[MM:SS]` timestamps.
  - **SRT (SubRip)**: Standard subtitle format with millisecond timecodes (`00:00:01,500 --> 00:00:04,200`).
  - **WebVTT (.vtt)**: Native HTML5 subtitle format.
  - **Markdown (.md)**: Formatted with course title, lecture name, metadata header, and timestamped sections.
  - **JSON**: Structured `{ metadata, cues: [{ start, end, timestamp, text }] }` for scripting and data pipelines.
- **Copy to Clipboard**: Quick copy button with visual confirmation.
- **Built-in Preview**: In-popup preview with word count before downloading.
- **Batch Course Export**: Download all transcripts across an entire course in a single click:
  - Bundled ZIP archive (recommended)
  - Single combined text/markdown file
  - Separate files per lecture
- **Multi-language**: Automatically detects and switches between all available caption languages.
- **In-Player Quick Button**: Unobtrusive transcript button injected directly into the Udemy video controls.
- **Local Execution**: Runs entirely in the browser. Zero analytics, zero tracking, no third-party servers.

---

## Installation (Developer Mode)

To install the extension manually in Chrome, Brave, Edge, or other Chromium browsers:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/lupohirp/udemy-transcript-downloader.git
   ```
2. Open the extensions manager:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** (toggle in top right).
4. Click **Load unpacked** (top left).
5. Select the `udemy-transcript-downloader` directory containing `manifest.json`.
6. The extension is installed and ready to use.

---

## Usage

1. Open any course lecture on Udemy or Udemy Business (`udemy.com/course/.../learn/lecture/...`).
2. Click the extension icon in the toolbar (or the "Transcript" button in the video controls).
3. Select your desired language and format.
4. Choose an action:
   - **Download**: Saves the transcript file.
   - **Copy**: Copies the text to your clipboard.
   - **Preview**: Expands the preview drawer with word count.
   - **Batch Course Export**: Expands the batch panel to export all lectures in the course.

---

## Project Structure

```
udemy-transcript-downloader/
├── manifest.json              # Chrome Manifest V3 configuration
├── background/
│   └── service-worker.js      # Background worker (downloads, badge status)
├── content/
│   ├── content.js             # Content script (API, tracks & DOM extraction)
│   └── content.css            # Styles for in-player button
├── popup/
│   ├── popup.html             # Popup user interface
│   ├── popup.css              # Popup styling
│   └── popup.js               # UI logic, preview, and export actions
├── utils/
│   ├── parser.js              # WebVTT parser & format converters
│   └── zip.js                 # Standalone ZIP builder for batch exports
├── icons/                     # Extension icons (16px, 48px, 128px)
├── scripts/
│   ├── generate_icons.py      # Icon generator script
│   └── package.sh             # ZIP packaging script for Chrome Web Store
├── tests/
│   └── test-parser.js         # Unit tests for format parsers
├── CHROMEWEBSTORE.md          # Web Store listing metadata & justifications
├── PRIVACY.md                 # Privacy Policy
├── LICENSE                    # MIT License
└── package.json
```

---

## Building & Packaging

To run the unit test suite:
```bash
npm test
```

To build the distributable zip file for the Chrome Web Store:
```bash
npm run package
```
The output file is written to `dist/udemy-transcript-downloader-v1.0.1.zip`.
