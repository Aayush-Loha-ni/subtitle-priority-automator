(function() {
  'use strict';

  let languages = [];
  let enabled = true;
  let saveTimer = null;

  const startBtn = document.getElementById('startBtn');
  const startText = document.getElementById('startText');
  const langList = document.getElementById('langList');
  const langCount = document.getElementById('langCount');
  const btnSettings = document.getElementById('btnSettings');
  const langSelect = document.getElementById('langSelect');
  const addBtn = document.getElementById('addBtn');
  const customInput = document.getElementById('customInput');
  const customAddBtn = document.getElementById('customAddBtn');

  function setStatus(on) {
    enabled = on;
    startBtn.classList.toggle('off', !on);
    startText.textContent = on ? 'Extension Active' : 'Extension Stopped';
  }

  function renderLanguages() {
    const valid = Array.isArray(languages) ? languages.filter(l => typeof l === 'string' && l.trim().length >= 2) : [];
    langCount.textContent = valid.length;

    if (!valid.length) {
      langList.innerHTML = '<div class="empty-msg">No languages configured</div>';
      return;
    }

    langList.innerHTML = valid.map((lang, i) => `
      <div class="lang-item" data-index="${i}">
        <span class="num">${i + 1}</span>
        <span class="name">${escapeHtml(lang)}</span>
        ${i === 0 ? '<span class="badge">TOP</span>' : ''}
        <button class="remove-btn" title="Remove ${escapeHtml(lang)}" aria-label="Remove ${escapeHtml(lang)}">&#10005;</button>
      </div>
    `).join('');

    langList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.closest('.lang-item').querySelector('.name').textContent;
        const idx = languages.findIndex(l => l.toLowerCase() === name.toLowerCase());
        if (idx !== -1) { languages.splice(idx, 1); scheduleSave(); renderLanguages(); }
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function addLang(lang) {
    const trimmed = lang.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (languages.some(l => l.toLowerCase() === trimmed.toLowerCase())) return;
    languages.push(trimmed);
    scheduleSave();
    renderLanguages();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set({ languages });
    }, 300);
  }

  startBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ enabled: !enabled });
  });

  addBtn.addEventListener('click', () => {
    if (langSelect.value) { addLang(langSelect.value); langSelect.value = ''; }
  });

  customAddBtn.addEventListener('click', () => {
    addLang(customInput.value);
    customInput.value = '';
  });

  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') customAddBtn.click();
  });

  btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  chrome.storage.sync.get({ enabled: true, languages: ['English'] }, (prefs) => {
    languages = Array.isArray(prefs.languages) ? prefs.languages.filter(l => typeof l === 'string' && l.trim().length >= 2) : ['English'];
    if (!languages.length) languages = ['English'];
    setStatus(typeof prefs.enabled === 'boolean' ? prefs.enabled : true);
    renderLanguages();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled !== undefined) setStatus(changes.enabled.newValue);
    if (changes.languages) {
      const val = changes.languages.newValue;
      languages = Array.isArray(val) ? val.filter(l => typeof l === 'string' && l.trim().length >= 2) : ['English'];
      if (!languages.length) languages = ['English'];
      renderLanguages();
    }
  });
})();
