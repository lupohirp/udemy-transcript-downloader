/**
 * Udemy Transcript & Caption Downloader
 * Content Script - runs on udemy.com and *.udemy.com
 */

(function () {
  // Prevent multiple injections
  if (window.__UDEMY_TRANSCRIPT_DOWNLOADER_INJECTED__) return;
  window.__UDEMY_TRANSCRIPT_DOWNLOADER_INJECTED__ = true;

  let currentCourseInfo = null;

  /**
   * Extracts course and lecture info from URL and DOM
   */
  async function detectLectureInfo() {
    const url = window.location.href;
    const pathname = window.location.pathname;

    // Matches /course/<course-slug>/learn/lecture/<lecture-id>
    const lectureMatch = pathname.match(/\/course\/([^/]+)\/learn\/lecture\/(\d+)/i);
    const slugMatch = pathname.match(/\/course\/([^/]+)/i);

    const courseSlug = slugMatch ? slugMatch[1] : null;
    const lectureId = lectureMatch ? lectureMatch[2] : null;

    if (!courseSlug) {
      return { isUdemy: true, isLecture: false, error: 'Not on a course page.' };
    }

    // Try finding course ID from DOM
    let courseId = null;
    const clpEl = document.querySelector('[data-clp-course-id]') || 
                  document.querySelector('[data-course-id]') ||
                  document.querySelector('div[data-module-id="course-taking"]');
    if (clpEl) {
      courseId = clpEl.getAttribute('data-clp-course-id') || 
                 clpEl.getAttribute('data-course-id') ||
                 clpEl.dataset?.courseId;
    }

    if (!courseId) {
      // Look in meta tags or script tags
      const meta = document.querySelector('meta[name="course_id"]');
      if (meta) courseId = meta.content;
    }

    // If still not found, query Udemy course API for ID
    if (!courseId && courseSlug) {
      try {
        const res = await fetch(`/api-2.0/courses/${courseSlug}/?fields[course]=id,title`);
        if (res.ok) {
          const data = await res.json();
          courseId = data.id;
        }
      } catch (err) {
        console.warn('Could not fetch courseId via course slug:', err);
      }
    }

    // Get Course and Lecture titles
    const courseTitleEl = document.querySelector('[data-purpose="course-header-title"]') ||
                          document.querySelector('header h1') ||
                          document.querySelector('.clp-lead__title');
    const courseTitle = courseTitleEl ? courseTitleEl.textContent.trim() : 
                        (courseSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    const lectureTitleEl = document.querySelector('[data-purpose="lecture-title"]') ||
                           document.querySelector('[class*="item-title"]') ||
                           document.querySelector('h2');
    const lectureTitle = lectureTitleEl ? lectureTitleEl.textContent.trim() : 
                         (lectureId ? `Lecture ${lectureId}` : 'Current Lecture');

    currentCourseInfo = {
      isUdemy: true,
      isLecture: Boolean(lectureId),
      courseSlug,
      courseId: courseId ? String(courseId) : null,
      lectureId: lectureId ? String(lectureId) : null,
      courseTitle,
      lectureTitle,
      url
    };

    return currentCourseInfo;
  }

  /**
   * Fetches available captions / transcripts for current lecture
   */
  async function fetchLectureCaptions() {
    const info = await detectLectureInfo();
    if (!info.isLecture || !info.lectureId) {
      return { success: false, error: 'No active lecture detected.' };
    }

    const availableCaptions = [];

    // Method 1: Try Udemy internal API
    if (info.courseId) {
      try {
        const apiUrl = `/api-2.0/users/me/subscribed-courses/${info.courseId}/lectures/${info.lectureId}/?fields[lecture]=asset,title,description&fields[asset]=captions,title,time_estimation`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.title) info.lectureTitle = data.title;
          const caps = data.asset?.captions;
          if (Array.isArray(caps) && caps.length > 0) {
            caps.forEach(c => {
              if (c.url) {
                availableCaptions.push({
                  id: c.id,
                  locale: c.locale_id || 'en_US',
                  title: c.video_label || c.title || c.locale_id || 'English',
                  url: c.url,
                  isDefault: Boolean(c.is_default),
                  source: 'api'
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('API captions fetch failed, trying fallbacks:', e);
      }
    }

    // Method 2: HTML5 Video textTracks or <track> tags
    if (availableCaptions.length === 0) {
      const video = document.querySelector('video');
      if (video) {
        // Check <track> tags
        const trackEls = video.querySelectorAll('track');
        trackEls.forEach(t => {
          if (t.src) {
            availableCaptions.push({
              id: t.srclang || t.label,
              locale: t.srclang || 'unknown',
              title: t.label || t.srclang || 'Captions',
              url: t.src,
              isDefault: t.default,
              source: 'track-tag'
            });
          }
        });

        // Check video.textTracks cues
        if (availableCaptions.length === 0 && video.textTracks && video.textTracks.length > 0) {
          for (let i = 0; i < video.textTracks.length; i++) {
            const tr = video.textTracks[i];
            if (tr.cues && tr.cues.length > 0) {
              const domCues = Array.from(tr.cues).map(c => ({
                start: c.startTime,
                end: c.endTime,
                text: c.text
              }));
              return {
                success: true,
                courseInfo: info,
                captions: [{
                  id: 'dom-track',
                  locale: tr.language || 'en',
                  title: tr.label || 'Video Player Track',
                  cues: domCues,
                  source: 'textTracks'
                }]
              };
            }
          }
        }
      }
    }

    // Method 3: DOM Transcript Panel cues
    if (availableCaptions.length === 0) {
      const domCues = extractDOMTranscriptCues();
      if (domCues && domCues.length > 0) {
        availableCaptions.push({
          id: 'dom-transcript-panel',
          locale: 'current',
          title: 'On-Screen Transcript Panel',
          cues: domCues,
          source: 'dom-panel'
        });
      }
    }

    return {
      success: availableCaptions.length > 0,
      courseInfo: info,
      captions: availableCaptions,
      error: availableCaptions.length === 0 ? 'No captions or transcript found for this lecture.' : null
    };
  }

  /**
   * Scrapes cues from Udemy's transcript drawer/panel if present in DOM
   */
  function extractDOMTranscriptCues() {
    const cueEls = document.querySelectorAll('[data-purpose="cue-container"], [class*="transcript--cue-container"]');
    if (!cueEls || cueEls.length === 0) return null;

    const cues = [];
    cueEls.forEach(el => {
      const timeBtn = el.querySelector('button') || el.querySelector('span');
      const timeText = timeBtn ? timeBtn.textContent.trim() : '00:00';
      const textEl = el.querySelector('[data-purpose="cue-text"]') || el.querySelector('p') || el;
      const text = textEl ? textEl.textContent.trim() : '';

      if (text) {
        cues.push({
          startFormatted: timeText,
          text
        });
      }
    });

    return cues.length > 0 ? cues : null;
  }

  /**
   * Downloads transcript text content for a specific caption URL or Cues
   */
  async function getTranscriptContent(captionItem) {
    if (captionItem.cues && captionItem.cues.length > 0) {
      return { success: true, type: 'cues', cues: captionItem.cues };
    }

    if (captionItem.url) {
      try {
        const res = await fetch(captionItem.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const vttText = await res.text();
        return { success: true, type: 'vtt', vttText };
      } catch (err) {
        return { success: false, error: `Failed to download VTT track: ${err.message}` };
      }
    }

    return { success: false, error: 'No transcript content available.' };
  }

  /**
   * Fetches all lectures in the course curriculum
   */
  async function fetchCurriculum() {
    const info = await detectLectureInfo();
    if (!info.courseId) {
      return { success: false, error: 'Course ID could not be identified.' };
    }

    try {
      const url = `/api-2.0/courses/${info.courseId}/subscriber-curriculum-items/?page_size=1000&fields[lecture]=title,object_index,asset&fields[asset]=captions,title`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const results = data.results || [];

      const lectures = [];
      results.forEach(item => {
        if (item._class === 'lecture') {
          const caps = item.asset?.captions || [];
          lectures.push({
            id: item.id,
            index: item.object_index,
            title: item.title,
            captions: caps.map(c => ({
              id: c.id,
              locale: c.locale_id,
              title: c.video_label || c.title || c.locale_id,
              url: c.url
            }))
          });
        }
      });

      return {
        success: true,
        courseTitle: info.courseTitle,
        totalLectures: lectures.length,
        lectures
      };
    } catch (err) {
      return { success: false, error: `Curriculum fetch failed: ${err.message}` };
    }
  }

  /**
   * Injects an in-player quick download button into Udemy's UI
   */
  function injectInPlayerButton() {
    if (document.getElementById('udemy-transcript-dl-btn')) return;

    // Look for video control bar or action row
    const controlBar = document.querySelector('[data-purpose="video-controls"]') ||
                       document.querySelector('[class*="control-bar--control-bar"]') ||
                       document.querySelector('[data-purpose="transcript-toggle"]')?.parentElement;

    if (!controlBar) return;

    const btn = document.createElement('button');
    btn.id = 'udemy-transcript-dl-btn';
    btn.className = 'udemy-transcript-quick-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Download Transcript');
    btn.title = 'Download Transcript (TXT/SRT/MD)';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>Transcript</span>
    `;

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Send message to open popup or trigger default download
      chrome.runtime.sendMessage({ action: 'QUICK_DOWNLOAD_CLICKED' });
    });

    controlBar.appendChild(btn);
  }

  // Set up observer to re-inject button when navigating lectures via SPA
  const observer = new MutationObserver(() => {
    if (window.location.pathname.includes('/learn/lecture/')) {
      injectInPlayerButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial detection and button injection
  if (window.location.pathname.includes('/learn/lecture/')) {
    detectLectureInfo();
    injectInPlayerButton();
  }

  // Listen for messages from popup or background service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message.action) {
          case 'GET_STATUS': {
            const info = await detectLectureInfo();
            sendResponse({ success: true, data: info });
            break;
          }
          case 'GET_CAPTIONS': {
            const capsData = await fetchLectureCaptions();
            sendResponse(capsData);
            break;
          }
          case 'GET_TRANSCRIPT_CONTENT': {
            const content = await getTranscriptContent(message.captionItem);
            sendResponse(content);
            break;
          }
          case 'GET_CURRICULUM': {
            const curriculum = await fetchCurriculum();
            sendResponse(curriculum);
            break;
          }
          default:
            sendResponse({ success: false, error: 'Unknown action' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open for async response
  });
})();
