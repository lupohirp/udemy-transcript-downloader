# Chrome Web Store Listing — Udemy Transcript & Caption Downloader

> Last Updated: 2026-09-22

## Store Listing

**Extension Name** [REQUIRED]  
Udemy Transcript & Caption Downloader

**Short Description** [REQUIRED]  
Download video transcripts and subtitles from Udemy & Udemy Business in TXT, SRT, VTT, Markdown, and JSON formats.

**Detailed Description** [REQUIRED]  
Udemy Transcript & Caption Downloader allows you to extract, preview, copy, and download video transcripts and subtitles from any Udemy or Udemy Business course lecture.

Whether you want to read lecture notes offline, review study materials, or export subtitle files for media players, this extension provides clean, properly formatted exports in multiple formats.

Key Features:
- Supports both personal Udemy (udemy.com) and enterprise Udemy Business accounts (*.udemy.com)
- Clean Text (.txt): Merged into natural, readable paragraphs with subtitle line break artifacts removed
- Timed Text (.txt): Preserves [MM:SS] timecodes at the start of each line
- Subtitle Formats: Standard SubRip (.srt) and WebVTT (.vtt) timecoded subtitles
- Markdown (.md): Structured notes with course metadata, lecture titles, and timestamped sections
- JSON (.json): Structured array with cue timestamps and text for scripts and data processing
- Quick Copy: Copy transcripts directly to the clipboard with one click
- In-Popup Preview: Inspect the full text and check word count before downloading
- Batch Course Export: Download all lecture transcripts in the entire course at once as a bundled ZIP archive, single merged file, or individual lecture files
- Multi-Language Support: Automatically detects all available subtitle tracks and languages (including auto-generated captions)
- In-Player Button: Download transcripts directly from the video player toolbar

How to Use:
1. Open any video lecture on Udemy or Udemy Business.
2. Click the extension icon in your browser toolbar (or use the quick button in the player).
3. Choose your preferred language and export format.
4. Click "Download" or "Copy".

Privacy:
All transcript extraction and formatting is executed locally inside your browser. The extension does not collect, store, or transmit any user data, account credentials, or browsing history to external servers.

Support & Issues:
Source code and issue tracker on GitHub: https://github.com/lupohirp/udemy-transcript-downloader

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
| 1.0.1 | 2026-09-22 | Initial release with Manifest V3, multi-format export (TXT, SRT, VTT, MD, JSON), live preview, in-player quick button, and batch course export. | Ready |


## Review Notes

### Known Issues / Limitations
- Transcripts are only available for lectures that have subtitles/captions enabled by the instructor or auto-generated by Udemy.
- User must be logged in and enrolled in the course to access lecture transcripts.
