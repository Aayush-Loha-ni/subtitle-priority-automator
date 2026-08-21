(function() {
  'use strict';
  let languages = ['English'];
  let saveTimer = null;

  function render() {
    const list = document.getElementById('langList');
    if (!languages.length) {
      list.innerHTML = '<div class="empty-msg">No languages selected. Add languages below.</div>';
      return;
    }
    list.innerHTML = languages.map((lang, i) => `
      <div class="lang-item" data-index="${i}">
        <span class="lang-name">${i + 1}. ${escapeHtml(lang)}</span>
        <div class="lang-actions">
          <button class="move-up" ${i === 0 ? 'disabled' : ''} title="Move up">&#9650;</button>
          <button class="move-down" ${i === languages.length - 1 ? 'disabled' : ''} title="Move down">&#9660;</button>
          <button class="remove" title="Remove">&#10005;</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.move-up').forEach(btn => btn.addEventListener('click', () => move(btn, -1)));
    list.querySelectorAll('.move-down').forEach(btn => btn.addEventListener('click', () => move(btn, 1)));
    list.querySelectorAll('.remove').forEach(btn => btn.addEventListener('click', () => remove(btn)));
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function move(btn, dir) {
    const item = btn.closest('.lang-item');
    const name = item.querySelector('.lang-name').textContent.replace(/^\d+\.\s*/, '');
    const idx = languages.findIndex(l => l.toLowerCase() === name.toLowerCase());
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= languages.length) return;
    [languages[idx], languages[target]] = [languages[target], languages[idx]];
    render();
    autoSave();
  }

  function remove(btn) {
    const item = btn.closest('.lang-item');
    const name = item.querySelector('.lang-name').textContent.replace(/^\d+\.\s*/, '');
    const idx = languages.findIndex(l => l.toLowerCase() === name.toLowerCase());
    if (idx !== -1) { languages.splice(idx, 1); render(); autoSave(); }
  }

  function addLang(lang) {
    const trimmed = lang.trim();
    if (!trimmed || trimmed.length < 2) return;
    if (languages.some(l => l.toLowerCase() === trimmed.toLowerCase())) return;
    languages.push(trimmed);
    render();
    autoSave();
  }

  function autoSave() {
    clearTimeout(saveTimer);
    showSaved(false);
    saveTimer = setTimeout(save, 500);
  }

  function save() {
    chrome.storage.sync.set({ languages }, () => {
      showSaved(true);
      setTimeout(() => showSaved(false), 2000);
    });
  }

  function showSaved(visible) {
    document.getElementById('saveStatus').classList.toggle('hidden', !visible);
  }

  document.getElementById('addBtn').addEventListener('click', () => {
    const select = document.getElementById('langSelect');
    if (select.value) { addLang(select.value); select.value = ''; }
  });

  document.getElementById('customAddBtn').addEventListener('click', () => {
    const input = document.getElementById('customInput');
    addLang(input.value);
    input.value = '';
  });

  document.getElementById('customInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('customAddBtn').click();
  });

  document.getElementById('btnSave').addEventListener('click', save);

  chrome.storage.sync.get({ languages: ['English'] }, (prefs) => {
    if (Array.isArray(prefs.languages)) {
      languages = prefs.languages.filter(l => typeof l === 'string' && l.trim().length >= 2);
    }
    if (!languages.length) languages = ['English'];
    render();
  });
})();
