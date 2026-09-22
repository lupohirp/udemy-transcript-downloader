# Privacy Policy for Udemy Transcript & Caption Downloader

**Last updated:** September 22, 2026

**Udemy Transcript & Caption Downloader** ("the extension") is an open-source browser extension designed to help users download and copy transcripts and subtitles from Udemy and Udemy Business courses they are enrolled in.

We are strongly committed to user privacy. This Privacy Policy describes how the extension handles user data.

---

### 1. Data Collection

**The extension does NOT collect, store, or transmit any personally identifiable information, browsing history, authentication tokens, passwords, or personal data.**

- **No Remote Servers:** The extension does not connect to any third-party servers, analytics services, or telemetry endpoints.
- **No Tracking:** There are no trackers, cookies, or tracking pixels bundled in the extension.
- **No Third-Party Sharing:** No data is sold, transferred, or shared with third parties under any circumstances.

### 2. Local Data Storage

The extension uses the browser's built-in `chrome.storage.local` API solely to store user interface preferences on your local device:
- Selected export format (e.g. Clean TXT, SRT, Markdown)
- Preferred transcript language (e.g. English, Italian, or Auto)

This data is stored strictly on your local machine and is never transmitted off your device.

### 3. Permissions & Usage

The extension requests the following permissions for the specific reasons listed:
- **`activeTab`**: Allows the extension to identify the current lecture title and transcript elements when you click the extension icon.
- **`storage`**: Allows saving your format and language preferences locally.
- **`downloads`**: Allows saving downloaded transcript files (.txt, .srt, .vtt, .md, .json) to your computer's Downloads directory.
- **`scripting`**: Allows injecting the transcript helper into active Udemy course tabs without requiring a full page refresh.
- **`host_permissions` (`https://*.udemy.com/*`)**: Necessary to interact with course lectures and fetch subtitle files across Udemy and Udemy Business domains.

### 4. Third-Party Services

The extension interacts only with Udemy's web interface (`udemy.com` and its enterprise subdomains) directly through your existing, active browser session. It does not use any third-party analytics, ads, or tracking services.

### 5. Open Source Code

The complete source code of this extension is publicly available on GitHub for audit and transparency:
[https://github.com/lupohirp/udemy-transcript-downloader](https://github.com/lupohirp/udemy-transcript-downloader)

### 6. Contact & Support

If you have any questions, suggestions, or concerns regarding this Privacy Policy, please open an issue on the GitHub repository or contact:

- **Developer:** Pasquale Lodise
- **Email:** pakilodi@gmail.com
- **GitHub:** [https://github.com/lupohirp](https://github.com/lupohirp)
