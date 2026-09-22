/**
 * Udemy Transcript & Caption Downloader
 * Background Service Worker (Manifest V3)
 */

// Initialize default settings on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  const currentSettings = await chrome.storage.local.get(['preferredFormat', 'includeTimestamps', 'languagePreference']);
  
  const defaults = {
    preferredFormat: currentSettings.preferredFormat || 'txt-clean',
    includeTimestamps: currentSettings.includeTimestamps ?? false,
    languagePreference: currentSettings.languagePreference || 'auto',
    batchMode: currentSettings.batchMode || 'zip'
  };

  await chrome.storage.local.set(defaults);
  console.log('Udemy Transcript Downloader installed. Defaults set:', defaults);
});

// Update badge when tab changes or navigates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab?.url) return;

  if (tab.url.includes('udemy.com') && tab.url.includes('/learn/lecture/')) {
    await chrome.action.setBadgeText({ tabId, text: 'CC' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#A435F0' }); // Udemy purple
  } else {
    await chrome.action.setBadgeText({ tabId, text: '' });
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'DOWNLOAD_FILE') {
        const { filename, content, mimeType = 'text/plain;charset=utf-8', isBase64 = false } = message;
        
        let dataUrl = '';
        if (isBase64) {
          dataUrl = `data:${mimeType};base64,${content}`;
        } else {
          // Encode content as UTF-8 Data URL
          const base64Content = btoa(unescape(encodeURIComponent(content)));
          dataUrl = `data:${mimeType};base64,${base64Content}`;
        }

        const downloadId = await chrome.downloads.download({
          url: dataUrl,
          filename: sanitizeFilename(filename),
          saveAs: false
        });

        sendResponse({ success: true, downloadId });
      } else if (message.action === 'UPDATE_BADGE') {
        const tabId = sender.tab?.id || message.tabId;
        if (tabId) {
          await chrome.action.setBadgeText({ tabId, text: message.text || '' });
          if (message.color) {
            await chrome.action.setBadgeBackgroundColor({ tabId, color: message.color });
          } else {
            await chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' }); // Green progress
          }
        }
        sendResponse({ success: true });
      } else if (message.action === 'QUICK_DOWNLOAD_CLICKED') {
        if (chrome.action?.openPopup) {
          try {
            await chrome.action.openPopup();
          } catch {
            // Popup couldn't be opened directly
          }
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('Service worker error:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true; // Keep channel open
});

/**
 * Sanitizes filename to prevent filesystem errors while preserving subfolders
 */
function sanitizeFilename(name) {
  if (!name) return 'transcript.txt';
  return name
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}
