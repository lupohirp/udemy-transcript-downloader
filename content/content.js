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

    // 1. Try finding course ID from DOM attributes
    let courseId = null;
    const clpEl = document.querySelector('body[data-clp-course-id]') ||
                  document.querySelector('[data-clp-course-id]') || 
                  document.querySelector('[data-course-id]') ||
                  document.querySelector('div[data-module-id="course-taking"]');
    if (clpEl) {
      courseId = clpEl.getAttribute('data-clp-course-id') || 
                 clpEl.getAttribute('data-course-id') ||
                 clpEl.dataset?.courseId;
    }

    // 2. Try data-module-args (standard on Udemy React course player)
    if (!courseId) {
      const moduleArgsEl = document.querySelector('[data-module-args]');
      if (moduleArgsEl) {
        try {
          const args = JSON.parse(moduleArgsEl.getAttribute('data-module-args'));
          if (args.courseId) courseId = String(args.courseId);
        } catch {}
      }
    }

    // 3. Try meta tags
    if (!courseId) {
      const meta = document.querySelector('meta[name="course_id"]');
      if (meta) courseId = meta.content;
    }

    // 4. Try Next.js __NEXT_DATA__
    if (!courseId) {
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl) {
        try {
          const nextData = JSON.parse(nextDataEl.textContent);
          if (nextData?.props?.pageProps?.courseId) {
            courseId = String(nextData.props.pageProps.courseId);
          }
        } catch {}
      }
    }

    // 5. Try HTML search for courseId / course_id
    if (!courseId) {
      const match = document.documentElement.innerHTML.match(/["']courseId["']:\s*(\d+)/i) ||
                    document.documentElement.innerHTML.match(/["']course_id["']:\s*(\d+)/i);
      if (match) courseId = match[1];
    }

    // 6. If still not found, query Udemy course API for ID
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
    let apiData = null;
    if (info.courseId) {
      try {
        const apiUrl = `/api-2.0/users/me/subscribed-courses/${info.courseId}/lectures/${info.lectureId}/?fields[lecture]=asset,title,description&fields[asset]=captions,title,time_estimation`;
        const res = await fetch(apiUrl);
        if (res.ok) apiData = await res.json();
      } catch (e) {
        console.warn('Subscribed courses captions fetch failed:', e);
      }
    }

    // Direct lecture endpoint fallback if courseId wasn't known
    if (!apiData) {
      try {
        const apiUrl = `/api-2.0/lectures/${info.lectureId}/?fields[lecture]=asset,title&fields[asset]=captions,title`;
        const res = await fetch(apiUrl);
        if (res.ok) apiData = await res.json();
      } catch (e) {
        console.warn('Direct lecture captions fetch failed:', e);
      }
    }

    if (apiData) {
      if (apiData.title) info.lectureTitle = apiData.title;
      const caps = apiData.asset?.captions;
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
   * Scrapes lecture links from the course sidebar in DOM as fallback
   */
  function extractCurriculumFromDOM() {
    const lectureLinks = document.querySelectorAll('a[href*="/learn/lecture/"]');
    const seen = new Set();
    const lectures = [];

    lectureLinks.forEach((link, idx) => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/learn\/lecture\/(\d+)/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        const titleText = link.textContent.replace(/\s+/g, ' ').trim() || `Lecture ${idx + 1}`;
        lectures.push({
          id: String(match[1]),
          index: idx + 1,
          title: titleText,
          assetType: 'Video'
        });
      }
    });

    return lectures;
  }

  /**
   * Fetches all lectures in the course curriculum
   */
  async function fetchCurriculum() {
    const info = await detectLectureInfo();
    let lectures = [];

    // Try API first if courseId is available
    if (info.courseId) {
      try {
        let nextUrl = `/api-2.0/courses/${info.courseId}/subscriber-curriculum-items/?page_size=200&fields[lecture]=title,object_index,asset`;
        let pagesCount = 0;

        while (nextUrl && pagesCount < 15) {
          pagesCount++;
          const res = await fetch(nextUrl);
          if (!res.ok) break;
          const data = await res.json();
          const results = data.results || [];

          results.forEach(item => {
            if (item._class === 'lecture') {
              lectures.push({
                id: String(item.id),
                index: item.object_index,
                title: item.title,
                assetType: item.asset?.asset_type || 'Video'
              });
            }
          });

          nextUrl = data.next || null;
        }
      } catch (err) {
        console.warn('Curriculum API fetch failed:', err);
      }
    }

    // Fallback: If API returned 0 lectures or failed, scrape from DOM sidebar
    if (lectures.length === 0) {
      lectures = extractCurriculumFromDOM();
    }

    return {
      success: lectures.length > 0,
      courseTitle: info.courseTitle,
      courseId: info.courseId,
      totalLectures: lectures.length,
      lectures,
      error: lectures.length === 0 ? 'No lectures found in course curriculum or sidebar.' : null
    };
  }

  /**
   * Fetches the transcript for a single lecture during batch export
   */
  async function fetchBatchLectureTranscript(courseId, lectureId, preferredLocale) {
    try {
      let data = null;

      // 1. Try with subscribed-courses endpoint
      if (courseId) {
        try {
          const apiUrl = `/api-2.0/users/me/subscribed-courses/${courseId}/lectures/${lectureId}/?fields[lecture]=asset,title&fields[asset]=captions,title`;
          const res = await fetch(apiUrl);
          if (res.ok) data = await res.json();
        } catch (e) {
          console.warn('Subscribed courses lecture detail failed:', e);
        }
      }

      // 2. Direct lecture endpoint fallback
      if (!data) {
        try {
          const apiUrl = `/api-2.0/lectures/${lectureId}/?fields[lecture]=asset,title&fields[asset]=captions,title`;
          const res = await fetch(apiUrl);
          if (res.ok) data = await res.json();
        } catch (e) {
          console.warn('Direct lecture detail failed:', e);
        }
      }

      if (!data) {
        return { success: false, error: 'Could not fetch lecture metadata.' };
      }

      const captions = data.asset?.captions;
      if (!Array.isArray(captions) || captions.length === 0) {
        return { success: false, error: 'No captions found for this lecture.' };
      }

      // Find matching caption
      let chosen = null;
      if (preferredLocale) {
        chosen = captions.find(c => c.locale_id === preferredLocale);
        if (!chosen) {
          const shortLang = preferredLocale.split('_')[0].toLowerCase();
          chosen = captions.find(c => (c.locale_id || '').toLowerCase().startsWith(shortLang));
        }
      }
      if (!chosen) {
        chosen = captions.find(c => c.is_default) || captions[0];
      }

      if (!chosen || !chosen.url) {
        return { success: false, error: 'Caption track has no download URL.' };
      }

      // Fetch VTT file
      const vttRes = await fetch(chosen.url);
      if (!vttRes.ok) return { success: false, error: `Failed to download VTT: HTTP ${vttRes.status}` };

      const vttText = await vttRes.text();
      return {
        success: true,
        vttText,
        captionTitle: chosen.video_label || chosen.title || chosen.locale_id,
        locale: chosen.locale_id,
        lectureTitle: data.title
      };
    } catch (err) {
      return { success: false, error: err.message };
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
          case 'GET_BATCH_LECTURE_TRANSCRIPT': {
            const trans = await fetchBatchLectureTranscript(
              message.courseId,
              message.lectureId,
              message.preferredLocale
            );
            sendResponse(trans);
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
