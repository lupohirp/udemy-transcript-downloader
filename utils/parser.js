/**
 * Udemy Transcript & Caption Downloader
 * Parser & Formatter Utilities
 */

/**
 * Parses a WebVTT string into an array of cue objects.
 * @param {string} vttText 
 * @returns {Array<{start: number, end: number, startFormatted: string, endFormatted: string, text: string}>}
 */
function parseWebVTT(vttText) {
  if (!vttText || typeof vttText !== 'string') return [];

  const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues = [];
  let i = 0;

  // Skip WEBVTT header and metadata
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.includes('-->')) {
      const parts = line.split('-->');
      const startStr = parts[0].trim().split(' ')[0];
      const endStr = parts[1].trim().split(' ')[0];

      const start = parseTimestampToSeconds(startStr);
      const end = parseTimestampToSeconds(endStr);

      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        // Strip HTML / VTT cue tags like <c.color> or <v Speaker>
        const cleanLine = lines[i]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        if (cleanLine) {
          textLines.push(cleanLine);
        }
        i++;
      }

      const cueText = textLines.join(' ').trim();
      if (cueText) {
        cues.push({
          start,
          end,
          startFormatted: formatSeconds(start, false),
          endFormatted: formatSeconds(end, false),
          text: cueText
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}

/**
 * Parses timestamp string (e.g. "01:23", "00:01:23.450") to seconds.
 * @param {string} str 
 * @returns {number}
 */
function parseTimestampToSeconds(str) {
  if (!str) return 0;
  const parts = str.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return parseFloat(m) * 60 + parseFloat(s);
  } else if (parts.length === 1) {
    return parseFloat(parts[0]) || 0;
  }
  return 0;
}

/**
 * Formats seconds into HH:MM:SS,mmm (SRT) or HH:MM:SS.mmm (VTT) or MM:SS (short).
 * @param {number} totalSeconds 
 * @param {boolean} isSrt 
 * @param {boolean} short 
 * @returns {string}
 */
function formatSeconds(totalSeconds, isSrt = false, short = false) {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);

  const pad = (n, z = 2) => String(n).padStart(z, '0');

  if (short) {
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  const delimiter = isSrt ? ',' : '.';
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${delimiter}${pad(ms, 3)}`;
}

/**
 * Converts cues to Clean Continuous Prose (TXT), merging sentences across subtitle breaks.
 * Ideal for reading and feeding into AI (ChatGPT, Claude, Gemini).
 * @param {Array<{start?: number, text: string}>} cues 
 * @returns {string}
 */
function toCleanText(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return '';

  const paragraphs = [];
  let currentParagraph = [];
  let wordCount = 0;

  for (let i = 0; i < cues.length; i++) {
    const text = (cues[i].text || '').trim();
    if (!text) continue;

    currentParagraph.push(text);
    wordCount += text.split(/\s+/).length;

    // Check if sentence ends and paragraph is reasonably long (around 60-100 words)
    const isSentenceEnd = /[.!?]$/.test(text);
    if (isSentenceEnd && wordCount >= 70) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
      wordCount = 0;
    }
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }

  return paragraphs.join('\n\n');
}

/**
 * Converts cues to Timestamped Text.
 * Format: [00:15] Sentence text...
 * @param {Array<{start?: number, startFormatted?: string, text: string}>} cues 
 * @returns {string}
 */
function toTimestampedText(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return '';

  return cues
    .map(c => {
      const timeStr = c.start !== undefined ? formatSeconds(c.start, false, true) : (c.startFormatted || '00:00');
      return `[${timeStr}] ${c.text.trim()}`;
    })
    .join('\n');
}

/**
 * Converts cues to SubRip Subtitle (.srt) format.
 * @param {Array<{start: number, end: number, text: string}>} cues 
 * @returns {string}
 */
function toSRT(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return '';

  return cues
    .map((c, idx) => {
      const start = formatSeconds(c.start || 0, true);
      const end = formatSeconds(c.end || (c.start || 0) + 2, true);
      return `${idx + 1}\n${start} --> ${end}\n${c.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Converts cues to WebVTT (.vtt) format.
 * @param {Array<{start: number, end: number, text: string}>} cues 
 * @returns {string}
 */
function toVTT(cues) {
  if (!Array.isArray(cues) || cues.length === 0) return 'WEBVTT\n\n';

  const body = cues
    .map((c, idx) => {
      const start = formatSeconds(c.start || 0, false);
      const end = formatSeconds(c.end || (c.start || 0) + 2, false);
      return `${idx + 1}\n${start} --> ${end}\n${c.text.trim()}`;
    })
    .join('\n\n');

  return `WEBVTT\n\n${body}\n`;
}

/**
 * Converts cues to Markdown (.md) format with lecture metadata and structured paragraphs.
 * @param {Array<{start?: number, text: string}>} cues 
 * @param {{courseTitle?: string, lectureTitle?: string, lectureIndex?: number|string, language?: string, url?: string}} meta 
 * @returns {string}
 */
function toMarkdown(cues, meta = {}) {
  const course = meta.courseTitle || 'Udemy Course';
  const lecture = meta.lectureTitle || 'Lecture Transcript';
  const lang = meta.language || 'Original';
  const url = meta.url || '';

  let md = `# ${lecture}\n\n`;
  md += `- **Course:** ${course}\n`;
  if (meta.lectureIndex) md += `- **Lecture Number:** ${meta.lectureIndex}\n`;
  md += `- **Language:** ${lang}\n`;
  if (url) md += `- **Source URL:** [Watch on Udemy](${url})\n`;
  md += `\n---\n\n## Transcript\n\n`;

  // Group cues into blocks of 1-2 minutes with timestamps as subheaders
  const blocks = [];
  let currentBlockTime = null;
  let currentBlockText = [];

  for (const c of cues) {
    const sec = c.start || 0;
    const timeLabel = formatSeconds(sec, false, true);

    if (currentBlockTime === null || sec - currentBlockTime >= 90) {
      if (currentBlockText.length > 0) {
        blocks.push(`### [${formatSeconds(currentBlockTime, false, true)}]\n${currentBlockText.join(' ')}\n`);
        currentBlockText = [];
      }
      currentBlockTime = sec;
    }

    currentBlockText.push(c.text.trim());
  }

  if (currentBlockText.length > 0) {
    blocks.push(`### [${formatSeconds(currentBlockTime, false, true)}]\n${currentBlockText.join(' ')}\n`);
  }

  md += blocks.join('\n');
  return md;
}

/**
 * Converts cues and metadata to JSON format.
 * @param {Array<{start?: number, end?: number, text: string}>} cues 
 * @param {Object} meta 
 * @returns {string}
 */
function toJSON(cues, meta = {}) {
  const data = {
    metadata: {
      courseTitle: meta.courseTitle || '',
      lectureTitle: meta.lectureTitle || '',
      lectureIndex: meta.lectureIndex || null,
      language: meta.language || '',
      sourceUrl: meta.url || '',
      exportedAt: new Date().toISOString()
    },
    totalCues: cues.length,
    cues: cues.map(c => ({
      start: c.start || 0,
      end: c.end || 0,
      timestamp: formatSeconds(c.start || 0, false, true),
      text: c.text
    }))
  };

  return JSON.stringify(data, null, 2);
}

// Export for ES modules, Node.js (CommonJS), and browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseWebVTT,
    parseTimestampToSeconds,
    formatSeconds,
    toCleanText,
    toTimestampedText,
    toSRT,
    toVTT,
    toMarkdown,
    toJSON
  };
} else if (typeof window !== 'undefined') {
  window.UdemyTranscriptParser = {
    parseWebVTT,
    parseTimestampToSeconds,
    formatSeconds,
    toCleanText,
    toTimestampedText,
    toSRT,
    toVTT,
    toMarkdown,
    toJSON
  };
}
