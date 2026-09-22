/**
 * Udemy Transcript & Caption Downloader
 * Popup Script (Manifest V3)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const stateInactive = document.getElementById('state-inactive');
  const stateLoading = document.getElementById('state-loading');
  const stateActive = document.getElementById('state-active');

  const courseTitleEl = document.getElementById('course-title');
  const lectureTitleEl = document.getElementById('lecture-title');
  const badgeCaptionsCount = document.getElementById('badge-captions-count');
  const selectLanguage = document.getElementById('select-language');
  const formatPills = document.querySelectorAll('.format-pill');

  const btnDownload = document.getElementById('btn-download');
  const btnCopy = document.getElementById('btn-copy');
  const copyBtnText = document.getElementById('copy-btn-text');
  const btnPreviewToggle = document.getElementById('btn-preview-toggle');
  const previewContainer = document.getElementById('preview-container');
  const previewText = document.getElementById('preview-text');
  const previewWordCount = document.getElementById('preview-word-count');
  const btnCopyPreview = document.getElementById('btn-copy-preview');

  const btnBatchToggle = document.getElementById('btn-batch-toggle');
  const batchContent = document.getElementById('batch-content');
  const btnBatchDownload = document.getElementById('btn-batch-download');
  const btnBatchCancel = document.getElementById('btn-batch-cancel');
  const batchProgressContainer = document.getElementById('batch-progress-container');
  const batchProgressBar = document.getElementById('batch-progress-bar');
  const batchProgressText = document.getElementById('batch-progress-text');
  const batchArrow = document.getElementById('batch-arrow');

  let batchCancelled = false;

  const toastEl = document.getElementById('toast');

  // State
  let currentTab = null;
  let lectureData = null;
  let availableCaptions = [];
  let selectedFormat = 'txt-clean';
  let cachedContent = null; // { languageId, format, text }

  // Load saved preferences
  const prefs = await chrome.storage.local.get(['preferredFormat', 'selectedLanguage']);
  if (prefs.preferredFormat) {
    selectedFormat = prefs.preferredFormat;
    formatPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.format === selectedFormat);
    });
  }

  // Helper: Show Toast Notification
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2500);
  }

  // Format Pills selection
  formatPills.forEach(pill => {
    pill.addEventListener('click', async () => {
      formatPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedFormat = pill.dataset.format;
      await chrome.storage.local.set({ preferredFormat: selectedFormat });

      // Refresh preview if open
      if (!previewContainer.classList.contains('hidden')) {
        await updatePreview();
      }
    });
  });

  // Check current active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab?.url || !tab.url.includes('udemy.com')) {
      showState('inactive');
      return;
    }

    // Try messaging the content script
    let response = null;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_CAPTIONS' });
    } catch {
      // If content script was not injected yet, inject it now
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
        response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_CAPTIONS' });
      } catch (injectionErr) {
        console.error('Script injection failed:', injectionErr);
      }
    }

    if (!response || !response.success || !response.captions || response.captions.length === 0) {
      if (response?.courseInfo?.isUdemy && !response?.courseInfo?.isLecture) {
        showState('inactive');
        const emptyDesc = stateInactive.querySelector('p');
        if (emptyDesc) emptyDesc.textContent = 'You are on Udemy! Please open any video lecture to download its transcript.';
        return;
      }
      showState('inactive');
      const emptyDesc = stateInactive.querySelector('p');
      if (emptyDesc) emptyDesc.textContent = response?.error || 'No transcript found for this lecture. Ensure subtitles/transcript are available.';
      return;
    }

    // Successfully loaded captions
    lectureData = response.courseInfo;
    availableCaptions = response.captions;
    renderLectureData();
    showState('active');

  } catch (err) {
    console.error('Popup init error:', err);
    showState('inactive');
  }

  function showState(state) {
    stateLoading.classList.add('hidden');
    stateInactive.classList.add('hidden');
    stateActive.classList.add('hidden');

    if (state === 'loading') stateLoading.classList.remove('hidden');
    else if (state === 'active') stateActive.classList.remove('hidden');
    else stateInactive.classList.remove('hidden');
  }

  function renderLectureData() {
    courseTitleEl.textContent = lectureData.courseTitle || 'Udemy Course';
    courseTitleEl.title = lectureData.courseTitle || '';
    lectureTitleEl.textContent = lectureData.lectureTitle || 'Lecture';
    lectureTitleEl.title = lectureData.lectureTitle || '';
    badgeCaptionsCount.textContent = `${availableCaptions.length} ${availableCaptions.length === 1 ? 'track' : 'tracks'}`;

    // Populate language selector
    selectLanguage.innerHTML = '';
    availableCaptions.forEach((cap, index) => {
      const opt = document.createElement('option');
      opt.value = cap.id;
      opt.textContent = `${cap.title} (${cap.locale})`;
      if (cap.isDefault || index === 0) opt.selected = true;
      selectLanguage.appendChild(opt);
    });

    // Restore user language preference if matches
    if (prefs.selectedLanguage) {
      const match = availableCaptions.find(c => c.locale === prefs.selectedLanguage || c.id === prefs.selectedLanguage);
      if (match) selectLanguage.value = match.id;
    }
  }

  selectLanguage.addEventListener('change', async () => {
    const selectedCap = getSelectedCaption();
    if (selectedCap) {
      await chrome.storage.local.set({ selectedLanguage: selectedCap.locale });
    }
    if (!previewContainer.classList.contains('hidden')) {
      await updatePreview();
    }
  });

  function getSelectedCaption() {
    const selectedId = selectLanguage.value;
    return availableCaptions.find(c => String(c.id) === String(selectedId)) || availableCaptions[0];
  }

  /**
   * Fetches and formats the transcript
   */
  async function getFormattedTranscript() {
    const cap = getSelectedCaption();
    if (!cap) throw new Error('No caption track selected');

    // Check memory cache
    const cacheKey = `${cap.id}_${selectedFormat}`;
    if (cachedContent && cachedContent.key === cacheKey) {
      return cachedContent;
    }

    // Request raw content from content script
    const contentRes = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'GET_TRANSCRIPT_CONTENT',
      captionItem: cap
    });

    if (!contentRes.success) {
      throw new Error(contentRes.error || 'Failed to fetch transcript content');
    }

    let cues = [];
    if (contentRes.type === 'cues') {
      cues = contentRes.cues;
    } else if (contentRes.type === 'vtt') {
      cues = window.UdemyTranscriptParser.parseWebVTT(contentRes.vttText);
    }

    if (cues.length === 0) {
      throw new Error('Transcript contains no cues or text');
    }

    // Format output
    let outputText = '';
    let fileExtension = 'txt';
    let mimeType = 'text/plain;charset=utf-8';

    const meta = {
      courseTitle: lectureData.courseTitle,
      lectureTitle: lectureData.lectureTitle,
      language: cap.title,
      url: currentTab.url
    };

    switch (selectedFormat) {
      case 'txt-clean':
        outputText = window.UdemyTranscriptParser.toCleanText(cues);
        fileExtension = 'txt';
        mimeType = 'text/plain;charset=utf-8';
        break;
      case 'txt-timed':
        outputText = window.UdemyTranscriptParser.toTimestampedText(cues);
        fileExtension = 'txt';
        mimeType = 'text/plain;charset=utf-8';
        break;
      case 'srt':
        outputText = window.UdemyTranscriptParser.toSRT(cues);
        fileExtension = 'srt';
        mimeType = 'application/x-subrip;charset=utf-8';
        break;
      case 'vtt':
        outputText = window.UdemyTranscriptParser.toVTT(cues);
        fileExtension = 'vtt';
        mimeType = 'text/vtt;charset=utf-8';
        break;
      case 'md':
        outputText = window.UdemyTranscriptParser.toMarkdown(cues, meta);
        fileExtension = 'md';
        mimeType = 'text/markdown;charset=utf-8';
        break;
      case 'json':
        outputText = window.UdemyTranscriptParser.toJSON(cues, meta);
        fileExtension = 'json';
        mimeType = 'application/json;charset=utf-8';
        break;
    }

    const safeCourse = sanitizeName(lectureData.courseTitle || 'Course');
    const safeLecture = sanitizeName(lectureData.lectureTitle || 'Lecture');
    const safeLang = sanitizeName(cap.locale || 'en');
    const filename = `${safeCourse} - ${safeLecture}.${safeLang}.${fileExtension}`;

    cachedContent = {
      key: cacheKey,
      text: outputText,
      filename,
      mimeType,
      cuesCount: cues.length
    };

    return cachedContent;
  }

  function sanitizeName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  // Download button
  btnDownload.addEventListener('click', async () => {
    try {
      btnDownload.disabled = true;
      btnDownload.innerHTML = '<span>Processing...</span>';

      const data = await getFormattedTranscript();

      // Trigger download via background service worker
      await chrome.runtime.sendMessage({
        action: 'DOWNLOAD_FILE',
        filename: data.filename,
        content: data.text,
        mimeType: data.mimeType
      });

      showToast('Download started!');
    } catch (err) {
      alert(`Download error: ${err.message}`);
    } finally {
      btnDownload.disabled = false;
      btnDownload.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Transcript
      `;
    }
  });

  // Copy button
  btnCopy.addEventListener('click', async () => {
    try {
      btnCopy.disabled = true;
      copyBtnText.textContent = '...';

      const data = await getFormattedTranscript();
      await navigator.clipboard.writeText(data.text);

      copyBtnText.textContent = 'Copied!';
      showToast('Transcript copied to clipboard!');

      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
        btnCopy.disabled = false;
      }, 1800);
    } catch (err) {
      alert(`Copy error: ${err.message}`);
      copyBtnText.textContent = 'Copy';
      btnCopy.disabled = false;
    }
  });

  // Preview toggle
  btnPreviewToggle.addEventListener('click', async () => {
    const isHidden = previewContainer.classList.contains('hidden');
    if (isHidden) {
      previewContainer.classList.remove('hidden');
      await updatePreview();
    } else {
      previewContainer.classList.add('hidden');
    }
  });

  async function updatePreview() {
    previewText.value = 'Loading preview...';
    try {
      const data = await getFormattedTranscript();
      previewText.value = data.text;
      const words = data.text.trim().split(/\s+/).filter(Boolean).length;
      previewWordCount.textContent = words.toLocaleString();
    } catch (err) {
      previewText.value = `Preview error: ${err.message}`;
    }
  }

  btnCopyPreview.addEventListener('click', async () => {
    if (previewText.value) {
      await navigator.clipboard.writeText(previewText.value);
      showToast('Preview copied to clipboard!');
    }
  });

  // Batch toggle
  btnBatchToggle.addEventListener('click', () => {
    const isHidden = batchContent.classList.contains('hidden');
    batchContent.classList.toggle('hidden', !isHidden);
    batchArrow.textContent = isHidden ? '▲' : '▼';
  });

  // Batch Cancel button
  btnBatchCancel.addEventListener('click', () => {
    batchCancelled = true;
    btnBatchCancel.disabled = true;
    batchProgressText.textContent = 'Stopping download...';
  });

  // Batch download
  btnBatchDownload.addEventListener('click', async () => {
    try {
      batchCancelled = false;
      btnBatchDownload.disabled = true;
      btnBatchCancel.disabled = false;
      btnBatchCancel.classList.remove('hidden');
      batchProgressContainer.classList.remove('hidden');
      batchProgressText.textContent = 'Fetching course curriculum...';
      batchProgressBar.style.width = '3%';

      const curRes = await chrome.tabs.sendMessage(currentTab.id, { action: 'GET_CURRICULUM' });
      if (!curRes.success || !curRes.lectures || curRes.lectures.length === 0) {
        throw new Error(curRes.error || 'No lectures found in curriculum.');
      }

      const lectures = curRes.lectures;
      const total = lectures.length;
      let downloaded = 0;
      let skipped = 0;

      // Determine preferred language
      const selectedCap = getSelectedCaption();
      const preferredLocale = selectedCap ? selectedCap.locale : (prefs.selectedLanguage || null);

      for (let i = 0; i < total; i++) {
        if (batchCancelled) break;

        const lec = lectures[i];
        batchProgressText.textContent = `[${i + 1}/${total}] ${lec.title.substring(0, 26)}...`;
        batchProgressBar.style.width = `${Math.round(((i + 1) / total) * 100)}%`;

        // Request transcript for this lecture via content script
        const transRes = await chrome.tabs.sendMessage(currentTab.id, {
          action: 'GET_BATCH_LECTURE_TRANSCRIPT',
          courseId: curRes.courseId,
          lectureId: lec.id,
          preferredLocale: preferredLocale
        });

        if (transRes && transRes.success && transRes.vttText) {
          const cues = window.UdemyTranscriptParser.parseWebVTT(transRes.vttText);
          if (cues && cues.length > 0) {
            let content = '';
            let ext = 'txt';
            let mime = 'text/plain;charset=utf-8';

            const meta = {
              courseTitle: curRes.courseTitle,
              lectureTitle: transRes.lectureTitle || lec.title,
              lectureIndex: lec.index,
              language: transRes.captionTitle
            };

            switch (selectedFormat) {
              case 'txt-clean':
                content = window.UdemyTranscriptParser.toCleanText(cues);
                ext = 'txt';
                mime = 'text/plain;charset=utf-8';
                break;
              case 'txt-timed':
                content = window.UdemyTranscriptParser.toTimestampedText(cues);
                ext = 'txt';
                mime = 'text/plain;charset=utf-8';
                break;
              case 'srt':
                content = window.UdemyTranscriptParser.toSRT(cues);
                ext = 'srt';
                mime = 'application/x-subrip;charset=utf-8';
                break;
              case 'vtt':
                content = window.UdemyTranscriptParser.toVTT(cues);
                ext = 'vtt';
                mime = 'text/vtt;charset=utf-8';
                break;
              case 'md':
                content = window.UdemyTranscriptParser.toMarkdown(cues, meta);
                ext = 'md';
                mime = 'text/markdown;charset=utf-8';
                break;
              case 'json':
                content = window.UdemyTranscriptParser.toJSON(cues, meta);
                ext = 'json';
                mime = 'application/json;charset=utf-8';
                break;
            }

            const safeCourse = sanitizeName(curRes.courseTitle || 'Udemy Course');
            const safeIndex = String(lec.index || i + 1).padStart(2, '0');
            const safeTitle = sanitizeName(lec.title || `Lecture_${safeIndex}`);
            const safeLang = sanitizeName(transRes.locale || 'en');
            const filename = `Udemy Transcripts/${safeCourse}/${safeIndex} - ${safeTitle}.${safeLang}.${ext}`;

            await chrome.runtime.sendMessage({
              action: 'DOWNLOAD_FILE',
              filename,
              content,
              mimeType: mime
            });

            downloaded++;
            // Small throttle to avoid flooding Chrome downloads manager
            await new Promise(r => setTimeout(r, 250));
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      batchProgressBar.style.width = '100%';
      if (batchCancelled) {
        batchProgressText.textContent = `Stopped: ${downloaded} downloaded, ${skipped} skipped.`;
        showToast(`Batch stopped: ${downloaded} downloaded.`);
      } else {
        batchProgressText.textContent = `Completed! ${downloaded} downloaded (${skipped} skipped/no subtitles).`;
        showToast(`Batch completed: ${downloaded} transcripts downloaded.`);
      }
    } catch (err) {
      console.error('Batch download error:', err);
      alert(`Batch error: ${err.message}`);
      batchProgressText.textContent = 'Batch download encountered an error.';
    } finally {
      btnBatchDownload.disabled = false;
      btnBatchCancel.classList.add('hidden');
    }
  });
});
