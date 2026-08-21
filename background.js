'use strict';

const ALLOWED_STATUSES = ['matched', 'searching', 'not-found', 'disabled'];

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.sync.set({ enabled: true, languages: ['English'] });
    chrome.runtime.openOptionsPage();
  }
});


const BADGE = {
  matched: { text: '', color: '#22c55e' },
  searching: { text: '\u25CB', color: '#6b7280' },
  'not-found': { text: '\u00D7', color: '#ef4444' },
  disabled: { text: 'OFF', color: '#6b7280' }
};

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'SUBTITLE_STATUS' || sender.id !== chrome.runtime.id) return;
  if (!ALLOWED_STATUSES.includes(msg.status)) return;
  if (!sender.tab?.id) return;

  const cfg = BADGE[msg.status] || BADGE.disabled;
  const lang = typeof msg.lang === 'string' ? msg.lang.substring(0, 2).toUpperCase() : '';
  const text = msg.status === 'matched' ? '\u2713' + lang : cfg.text;
  const title = msg.status === 'matched' ? 'Subtitle: ' + msg.lang : 'Subtitle: ' + msg.status;

  chrome.action.setBadgeText({ tabId: sender.tab.id, text });
  chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: cfg.color });
  chrome.action.setTitle({ tabId: sender.tab.id, title });
  try { chrome.action.setBadgeTextColor({ tabId: sender.tab.id, color: '#ffffff' }); } catch {}
});
