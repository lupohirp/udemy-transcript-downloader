# 🎓 Udemy Transcript & Caption Downloader

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-purple.svg)](PRIVACY.md)

> A modern, open-source Google Chrome extension (Manifest V3) to download video transcripts and subtitles from **Udemy** and **Udemy Business** in **Clean TXT, Timed TXT, SRT, VTT, Markdown, and JSON** formats.

---

[English](#features) • [Italiano (Guida in Italiano)](#guida-in-italiano-)

---

## ✨ Features

- 🏢 **Udemy & Udemy Business Support**: Works on both personal `udemy.com` and corporate/enterprise portals (`*.udemy.com`).
- 📄 **6 Export Formats**:
  - **Clean TXT**: Smooth, continuous paragraphs with sentence-aware merging (ideal for reading and feeding into AI like ChatGPT, Claude, Gemini, or NotebookLM).
  - **Timed TXT**: Line-by-line format with `[MM:SS]` timestamps.
  - **SRT (SubRip)**: Standard subtitle format with millisecond timecodes (`00:00:01,500 --> 00:00:04,200`).
  - **VTT (WebVTT)**: Native HTML5 subtitle format.
  - **Markdown (.md)**: Nicely structured with course title, lecture name, metadata headers, and timestamped sections.
  - **JSON**: Structured `{ metadata, cues: [{ start, end, timestamp, text }] }` for automation and RAG pipelines.
- 📋 **1-Click Copy to Clipboard**: Instant copy with visual feedback without saving files.
- 👁️ **Built-in Live Preview**: Preview transcript text and word count directly inside the popup.
- 📦 **Batch Course Export**: Download all lecture transcripts in an entire course at once.
- 🌐 **Multi-Language Detection**: Automatically lists and switches between all available subtitle languages and auto-generated captions.
- ⚡ **In-Player Quick Button**: Adds an unobtrusive "Transcript" button directly into the Udemy video control bar.
- 🔒 **100% Private & Local**: Zero tracking, zero telemetry, no external servers. All processing runs entirely inside your browser.

---

## 🚀 Installation (Developer Mode / Sideloading)

You can install and use the extension immediately in Google Chrome, Brave, Edge, or any Chromium browser:

1. **Clone or Download this repository**:
   ```bash
   git clone https://github.com/lupohirp/udemy-transcript-downloader.git
   ```
   *(or download as ZIP from GitHub and extract it)*.
2. Open your browser and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** (*Carica estensione non pacchettizzata*) in the top-left.
5. Select the folder containing `manifest.json` (`udemy-transcript-downloader`).
6. The extension is now installed and active! Pin it to your browser toolbar for quick access.

---

## 🛠️ Usage

1. Open any video lecture on **Udemy** or **Udemy Business** (URL matches `https://*.udemy.com/course/.../learn/lecture/...`).
2. Click the **Udemy Transcripts** extension icon in your toolbar (or the "Transcript" button in the video controls).
3. Select your desired:
   - **Language** (e.g. *English [Auto]*, *Italian*, *Spanish*, etc.)
   - **Format** (*TXT (Clean)*, *TXT (Timed)*, *SRT*, *VTT*, *Markdown*, *JSON*)
4. Click:
   - 📥 **Download Transcript** to save the file.
   - 📋 **Copy** to copy text to your clipboard.
   - 👁️ **Preview** to inspect the text and word count.
   - 📦 **Batch Course Export** to export transcripts for all lectures in the course.

---

## 🏪 Publishing to Chrome Web Store

This repository is already 100% prepared for publication on the Chrome Web Store:

1. **Pre-configured Metadata**:
   - Manifest V3 compliant with minimal permissions (`activeTab`, `storage`, `downloads`, `scripting`, `host_permissions: ["https://*.udemy.com/*"]`).
   - High-resolution icons created (`icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`).
   - Detailed permissions justifications in [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).
   - Public Privacy Policy in [PRIVACY.md](PRIVACY.md).
2. **Generate the Distribution ZIP**:
   Run the packaging script:
   ```bash
   npm run package
   # or: bash scripts/package.sh
   ```
   This generates `dist/udemy-transcript-downloader-v1.0.0.zip` ready for upload.
3. **Upload to Chrome Developer Dashboard**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
   - Click **Add new item** and upload `dist/udemy-transcript-downloader-v1.0.0.zip`.
   - Copy-paste the store descriptions, category, and permissions justifications from [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).
   - Add your screenshots and submit for review!

---

## 📂 Project Structure

```
udemy-transcript-downloader/
├── manifest.json              # Chrome Manifest V3 configuration
├── background/
│   └── service-worker.js      # Background worker (downloads, badge, defaults)
├── content/
│   ├── content.js             # Content script (API, video tracks & DOM extractor)
│   └── content.css            # Styles for in-player button
├── popup/
│   ├── popup.html             # Popup user interface
│   ├── popup.css              # Popup styling (Udemy purple theme)
│   └── popup.js               # UI logic, preview, and format actions
├── utils/
│   └── parser.js              # Universal WebVTT parser & format converters
├── icons/                     # Extension icons (16px, 48px, 128px)
├── scripts/
│   ├── generate_icons.py      # Script to regenerate PNG icons
│   └── package.sh             # Packages clean ZIP for Chrome Web Store
├── tests/
│   └── test-parser.js         # Automated unit tests for format parsers
├── CHROMEWEBSTORE.md          # Web Store listing metadata & justifications
├── PRIVACY.md                 # Privacy Policy (required by Web Store)
├── LICENSE                    # MIT Open Source License
└── package.json               # NPM scripts and project info
```

---

<a name="guida-in-italiano-"></a>
## 🇮🇹 Guida in Italiano

### Descrizione
**Udemy Transcript & Caption Downloader** è un'estensione open-source per Google Chrome (conforme allo standard **Manifest V3**) che ti consente di scaricare e copiare le trascrizioni e i sottotitoli da qualsiasi lezione o corso su **Udemy** e **Udemy Business**.

### Funzionalità Principali
- **Compatibile con Udemy e Udemy Business**: supporta sia gli account personali che aziendali (`udemy.com` e qualsiasi sottodominio `*.udemy.com`).
- **6 Formati di Esportazione**:
  - **TXT Pulito (Clean)**: testo continuo senza interruzioni di riga artificiali, perfetto da leggere o da inviare a modelli AI come ChatGPT, Claude, Gemini o NotebookLM per creare riassunti o mappe concettuali.
  - **TXT Temporizzato (Timed)**: con timestamp `[MM:SS]` all'inizio di ogni frase.
  - **SRT**: formato standard per sottotitoli video.
  - **VTT**: formato WebVTT originale.
  - **Markdown (.md)**: strutturato con titolo del corso, numero lezione e sezioni temporizzate.
  - **JSON**: formato strutturato con tempi e testo per automazioni o database vettoriali (RAG).
- **Copia con 1 Click**: copia istantanea negli appunti.
- **Anteprima Live**: leggi il testo e vedi il conteggio parole direttamente nel popup prima di scaricare.
- **Esportazione Batch del Corso**: scarica le trascrizioni di tutte le lezioni del corso in blocco.
- **Supporto Multi-lingua**: seleziona qualsiasi lingua di sottotitoli disponibile per il video.
- **Pulsante rapido nel Player**: pulsante integrato direttamente nella barra dei controlli video di Udemy.
- **100% Locale e Privato**: nessun server esterno, nessuna registrazione, zero tracciamento.

### Come Installarla Subito in Chrome (Modalità Sviluppatore)
1. Clona o scarica questa cartella sul tuo computer:
   ```bash
   git clone https://github.com/lupohirp/udemy-transcript-downloader.git
   ```
2. Apri Chrome e digita nella barra degli indirizzi:
   ```
   chrome://extensions/
   ```
3. Attiva l'interruttore **Modalità sviluppatore** in alto a destra.
4. Clicca su **Carica estensione non pacchettizzata** in alto a sinistra.
5. Seleziona la cartella del progetto (`udemy-transcript-downloader`).
6. Fatto! L'estensione è attiva e pronta all'uso.

### Come Pubblicarla sul Chrome Web Store
1. Esegui il comando per creare lo zip pronto per la pubblicazione:
   ```bash
   npm run package
   ```
   Troverai il file pronto in `dist/udemy-transcript-downloader-v1.0.0.zip`.
2. Accedi alla [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
3. Clicca su **Aggiungi nuovo elemento** e carica lo zip appena creato.
4. Compila la scheda del negozio copiando e incollando le informazioni dal file [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md) (include descrizioni, categorie e la giustificazione dei permessi approvata).
5. Inserisci come Privacy Policy il link al file [PRIVACY.md](PRIVACY.md).
6. Invia per la revisione!

---

## 🧪 Testing

Run the automated parser and conversion test suite:
```bash
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.
