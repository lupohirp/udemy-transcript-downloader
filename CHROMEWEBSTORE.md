# Chrome Web Store Listing — Udemy Transcript & Caption Downloader

> Last Updated: 2026-09-22

## Store Listing

**Extension Name** [REQUIRED]  
Udemy Transcript & Caption Downloader

**Short Description** [REQUIRED]  
Download video transcripts and subtitles from Udemy & Udemy Business in TXT, SRT, VTT, Markdown, and JSON formats.

**Detailed Description** [REQUIRED]  
Udemy Transcript & Caption Downloader allows you to easily extract, preview, copy, and download video transcripts and subtitles from any Udemy or Udemy Business course lecture with a single click.

Whether you want to read lecture notes offline, import transcripts into AI tools (ChatGPT, Claude, Gemini, NotebookLM) for study summaries, or save subtitle files for video players, this extension provides clean, properly formatted exports in multiple formats.

Key Features:
- Supports both personal Udemy (udemy.com) and enterprise Udemy Business accounts (*.udemy.com)
- Clean Text Export (.txt): Formatted into natural, readable paragraphs with speech pauses and sentence structure preserved—perfect for reading, studying, and feeding into AI models
- Timestamped Text Export (.txt): Retains timecodes [MM:SS] line by line for quick reference
- Subtitle Formats: Full support for standard SubRip Subtitles (.srt) and WebVTT (.vtt)
- Markdown (.md) Format: Neatly organized headers, course metadata, and lecture sections
- JSON (.json) Format: Structured cue timing and text for developers and knowledge workflows
- 1-Click Copy to Clipboard: Instantly copy full transcripts with visual confirmation
- Built-in Live Preview: Inspect transcripts, check word count, and copy text directly from the popup
- Course Batch Export: Download transcripts for all lectures across an entire course in your selected format
- Multi-Language Support: Automatically detects all available subtitle tracks and languages (including auto-generated captions)
- In-Player Quick Button: Download transcripts directly from the course player without leaving the page

How to Use:
1. Open any video lecture on Udemy or Udemy Business.
2. Click the Udemy Transcript Downloader icon in your browser toolbar (or use the quick button in the player).
3. Choose your preferred language and export format (TXT, SRT, VTT, Markdown, or JSON).
4. Click "Download Transcript" or "Copy" to save your transcript immediately.

Privacy & Permissions Note:
Your privacy is fully protected. All transcript processing and formatting takes place entirely locally within your browser. The extension never collects, stores, or transmits your account details, browsing history, or personal data to any external server.

Support & Feedback:
If you encounter any issues or have feature requests, visit our open-source project page on GitHub: https://github.com/lupohirp/udemy-transcript-downloader/issues

**Category** [REQUIRED]  
Productivity

**Single Purpose** [REQUIRED]  
Downloads video transcripts and subtitles from Udemy and Udemy Business courses in multiple text and subtitle formats.

**Primary Language** [REQUIRED]  
English


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | `docs/screenshots/screenshot-popup.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `docs/screenshots/screenshot-preview.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `docs/screenshots/screenshot-player-btn.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `docs/promo/promo-small.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | `docs/promo/promo-marquee.png` |

### Screenshot Notes
- Screenshot 1: Popup open during a Udemy lecture showing detected lecture title, language selector, format pills, and download button.
- Screenshot 2: Live preview drawer open in the popup displaying formatted transcript text and word count.
- Screenshot 3: Udemy course video player showing the injected quick "Transcript" button in the control bar.


## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `activeTab` | permissions | Needed to inspect the active Udemy course lecture tab and extract transcript content when the user interacts with the extension. |
| `storage` | permissions | Needed to persist the user's preferred export format (e.g., Clean TXT, SRT, Markdown) and language selection across browser sessions. |
| `downloads` | permissions | Needed to save exported transcript and subtitle files directly to the user's computer with organized filenames. |
| `scripting` | permissions | Needed to inject the transcript extraction helper into active Udemy lecture tabs without requiring a page reload. |
| `https://*.udemy.com/*` | host_permissions | Needed to access course lectures and subtitle tracks across Udemy and Udemy Business portals (*.udemy.com). |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension does NOT collect, store, or transmit any user data, personal info, authentication details, or web history. All operations run locally inside the browser.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL** [REQUIRED]  
https://github.com/lupohirp/udemy-transcript-downloader/blob/main/PRIVACY.md


## Distribution

**Visibility**: Public  
**Regions**: All regions  


## Developer Info

**Publisher Name** [REQUIRED]  
Pasquale Lodise

**Contact Email** [REQUIRED]  
pakilodi@gmail.com

**Support URL / Email** [RECOMMENDED]  
https://github.com/lupohirp/udemy-transcript-downloader/issues

**Homepage URL** [RECOMMENDED]  
https://github.com/lupohirp/udemy-transcript-downloader


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-22 | Initial release with Manifest V3, multi-format export (TXT, SRT, VTT, MD, JSON), live preview, and batch export. | Draft |


## Review Notes

### Known Issues / Limitations
- Transcripts are only available for lectures that have subtitles/captions enabled by the instructor or auto-generated by Udemy.
- User must be logged in and enrolled in the course to access lecture transcripts.
