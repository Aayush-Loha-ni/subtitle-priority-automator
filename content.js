(function() {
  'use strict';

  let enabled = true;
  let languages = ['English'];
  const activeTracks = new WeakMap();

  // ponytail: 25 languages + ISO codes + locale variants, covers 99% of real-world use
  const LANG_MAP = {
    'english': 'en', 'en': 'en', 'en-us': 'en', 'en-gb': 'en',
    'japanese': 'ja', 'ja': 'ja', 'ja-jp': 'ja', '\u65E5\u672C\u8A9E': 'ja',
    'spanish': 'es', 'es': 'es', 'es-es': 'es', 'es-mx': 'es', 'espa\u00F1ol': 'es',
    'french': 'fr', 'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr', 'fran\u00E7ais': 'fr',
    'german': 'de', 'de': 'de', 'de-de': 'de', 'deutsch': 'de',
    'korean': 'ko', 'ko': 'ko', 'ko-kr': 'ko', '\uD55C\uAD6D\uC5B4': 'ko',
    'chinese': 'zh', 'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', '\u4E2D\u6587': 'zh',
    'portuguese': 'pt', 'pt': 'pt', 'pt-br': 'pt', 'pt-pt': 'pt', 'portugu\u00EAs': 'pt',
    'italian': 'it', 'it': 'it', 'it-it': 'it', 'italiano': 'it',
    'russian': 'ru', 'ru': 'ru', 'ru-ru': 'ru', '\u0440\u0443\u0441\u0441\u043A\u0438\u0439': 'ru',
    'arabic': 'ar', 'ar': 'ar', '\u0627\u0644\u0639\u0631\u0628\u064A\u0629': 'ar',
    'hindi': 'hi', 'hi': 'hi', 'hi-in': 'hi', '\u0939\u093F\u0928\u094D\u0926\u0940': 'hi',
    'dutch': 'nl', 'nl': 'nl', 'nl-nl': 'nl', 'nederlands': 'nl',
    'polish': 'pl', 'pl': 'pl', 'pl-pl': 'pl', 'polski': 'pl',
    'turkish': 'tr', 'tr': 'tr', 'tr-tr': 'tr', 't\u00FCrk\u00E7e': 'tr',
    'swedish': 'sv', 'sv': 'sv', 'sv-se': 'sv', 'svenska': 'sv',
    'danish': 'da', 'da': 'da', 'da-dk': 'da', 'dansk': 'da',
    'finnish': 'fi', 'fi': 'fi', 'fi-fi': 'fi', 'suomi': 'fi',
    'norwegian': 'no', 'no': 'no', 'nb-no': 'no', 'nn-no': 'no', 'norsk': 'no',
    'czech': 'cs', 'cs': 'cs', 'cs-cz': 'cs', '\u010De\u0161tina': 'cs',
    'thai': 'th', 'th': 'th', 'th-th': 'th', '\u0E44\u0E17\u0E22': 'th',
    'vietnamese': 'vi', 'vi': 'vi', 'vi-vn': 'vi', 'ti\u1EBFng vi\u1EC7t': 'vi',
    'indonesian': 'id', 'id': 'id', 'id-id': 'id', 'bahasa indonesia': 'id',
    'romanian': 'ro', 'ro': 'ro', 'ro-ro': 'ro', 'rom\u00E2n\u0103': 'ro',
    'hungarian': 'hu', 'hu': 'hu', 'hu-hu': 'hu', 'magyar': 'hu',
    'ukrainian': 'uk', 'uk': 'uk', 'uk-ua': 'uk', '\u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430': 'uk',
    'greek': 'el', 'el': 'el', 'el-gr': 'el', '\u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC': 'el'
  };

  function normalizeLang(s) {
    return LANG_MAP[s.toLowerCase().trim()] || s.toLowerCase().trim();
  }

  function matchLanguage(text, prefs) {
    const t = text.toLowerCase().trim();
    for (const p of prefs) {
      const pLow = p.toLowerCase().trim();
      if (t === pLow) return true;
      if (pLow.length > 2 && t.includes(pLow)) return true;
      if (t.length > 2 && pLow.includes(t)) return true;
      if (normalizeLang(t) === normalizeLang(pLow)) return true;
    }
    return false;
  }

  function detectPlatform() {
    const h = location.hostname;
    if (h.includes('youtube')) return 'youtube';
    if (h.includes('netflix')) return 'netflix';
    if (h.includes('primevideo') || (h.includes('amazon') && location.pathname.includes('video'))) return 'prime';
    if (h.includes('disneyplus')) return 'disney';
    if (h.includes('hulu')) return 'hulu';
    if (h.includes('crunchyroll')) return 'crunchyroll';
    if (h.includes('vimeo')) return 'vimeo';
    if (h.includes('twitch')) return 'twitch';
    if (h.includes('donkey')) return 'generic';
    return 'generic';
  }

  // ─── Tier 1: Platform JS APIs ────────────────────────

  function tryPlatformAPI(video, platform, prefs) {
    if (platform === 'youtube') return tryYouTubeAPI(prefs);
    if (platform === 'netflix') return tryNetflixAPI(prefs);
    return null;
  }

  function tryYouTubeAPI(prefs) {
    try {
      const data = JSON.parse(document.getElementById('ytInitialPlayerResponse')?.textContent || '{}');
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks?.length) return null;

      let match = null;
      for (const p of prefs) {
        match = tracks.find(t => matchLanguage(t.languageCode, [p]) || matchLanguage(t.name?.simpleText || '', [p]));
        if (match) break;
      }
      if (!match) return null;

      // Execute in page's main world to avoid DOM method hijacking
      // content script → page: call the real YouTube player API
      const script = document.createElement('script');
      script.textContent = [
        '(function(){',
        'var p=document.getElementById("movie_player");',
        'if(!p)return;',
        'if(typeof p.loadModule==="function"){try{p.loadModule("captions")}catch(e){}}',
        'p.setOption("captions","track",' + JSON.stringify({ languageCode: match.languageCode, tts: false }) + ');',
        '})()'
      ].join('\n');
      document.documentElement.appendChild(script);
      script.remove();
      return match.languageCode;
    } catch {}
    return null;
  }

  let netflixMarker = null;

  function tryNetflixAPI(prefs) {
    try {
      if (!netflixMarker) {
        netflixMarker = document.createElement('div');
        netflixMarker.id = '_ns_sub';
        netflixMarker.style.display = 'none';
        document.documentElement.appendChild(netflixMarker);
      }
      netflixMarker.textContent = '';

      const script = document.createElement('script');
      script.textContent = [
        '(function(){',
        'try{',
        'var api=window.netflix&&window.netflix.appContext&&window.netflix.appContext.state&&window.netflix.appContext.state.playerApp&&window.netflix.appContext.state.playerApp.getAPI&&window.netflix.appContext.state.playerApp.getAPI();',
        'if(!api){document.getElementById("_ns_sub").textContent="__fail__";return;}',
        'var ids=api.videoPlayer&&api.videoPlayer.getAllPlayerSessionIds();',
        'if(!ids||!ids.length){document.getElementById("_ns_sub").textContent="__fail__";return;}',
        'var p=api.videoPlayer.getVideoPlayerBySessionId(ids[0]);',
        'if(!p||typeof p.getTextTrackList!=="function"){document.getElementById("_ns_sub").textContent="__fail__";return;}',
        'var tracks=p.getTextTrackList();',
        'if(!tracks||!tracks.length){document.getElementById("_ns_sub").textContent="__fail__";return;}',
        'var prefs=' + JSON.stringify(prefs) + ';',
        'var found=null;',
        'for(var i=0;i<prefs.length;i++){',
        'var pLow=prefs[i].toLowerCase().trim();',
        'for(var j=0;j<tracks.length;j++){',
        'var t=tracks[j];var label=t.language||t.displayName||t.locale||"";',
        'var tLow=label.toLowerCase().trim();',
        'if(tLow===pLow||(pLow.length>2&&tLow.indexOf(pLow)!==-1)||(tLow.length>2&&pLow.indexOf(tLow)!==-1)){',
        'p.setTextTrack(t);found=label;break;',
        '}',
        '}',
        'if(found)break;',
        '}',
        'document.getElementById("_ns_sub").textContent=found||"__fail__";',
        '}catch(e){document.getElementById("_ns_sub").textContent="__fail__";}',
        '})()'
      ].join('\n');
      document.documentElement.appendChild(script);
      script.remove();

      const result = netflixMarker.textContent;
      return result && result !== '__fail__' ? result : null;
    } catch {}
    return null;
  }

  // ─── Tier 2: HTML5 textTracks API ────────────────────

  function tryTextTracks(video, prefs) {
    try {
      const tracks = video.textTracks;
      if (!tracks?.length) return null;
      let found = null;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (t.kind !== 'subtitles' && t.kind !== 'captions') continue;
        const label = t.language || t.label || '';
        if (matchLanguage(label, prefs)) {
          t.mode = 'showing';
          found = label;
        } else if (t.mode === 'showing') {
          t.mode = 'hidden';
        }
      }
      return found;
    } catch {}
    return null;
  }

  // ─── Tier 3: Platform DOM selectors ──────────────────

  function tryPlatformDOM(platform, prefs) {
    const handlers = {
      youtube: tryYouTubeDOM,
      netflix: tryNetflixDOM,
      prime: tryPrimeDOM,
      disney: tryDisneyDOM,
      hulu: tryHuluDOM,
      crunchyroll: tryCrunchyrollDOM
    };
    return (handlers[platform] || (() => null))(prefs);
  }

  function tryYouTubeDOM(prefs) {
    try {
      const ccBtn = document.querySelector('.ytp-subtitles-button');
      if (ccBtn && ccBtn.getAttribute('aria-pressed') !== 'true') ccBtn.click();
      const subItems = document.querySelectorAll('.ytp-panel-menu .ytp-menuitem');
      for (const item of subItems) {
        const text = item.textContent.trim();
        if (matchLanguage(text, prefs)) { item.click(); return text; }
      }
      const settingsBtn = document.querySelector('.ytp-settings-button');
      if (!settingsBtn || document.querySelector('.ytp-panel-menu')) return null;
      settingsBtn.click();
      requestAnimationFrame(() => {
        const items = document.querySelectorAll('.ytp-panel-menu .ytp-menuitem');
        const ccItem = Array.from(items).find(m => /subtitles|\bcc\b|captions/i.test(m.textContent));
        if (ccItem) ccItem.click();
      });
    } catch {}
    return null;
  }

  function tryNetflixDOM(prefs) {
    try {
      const sel = ['[role="radio"][aria-label*="subtitle"i],[role="radio"][aria-label*="caption"i]', '.audio-subtitle-picker [role="radio"]', '[data-uia*="subtitle"] button,[data-uia*="caption"] button', '.track-list button'];
      for (const s of sel) {
        for (const btn of document.querySelectorAll(s)) {
          const text = btn.textContent.trim();
          if (matchLanguage(text, prefs)) { btn.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  function tryPrimeDOM(prefs) {
    try {
      const sel = ['button[data-action="subtitles"]', 'button[data-testid*="subtitle"],button[data-testid*="caption"]', '[class*="subtitle"] button,[class*="cc"] button', 'li[class*="subtitle"],li[class*="caption"]'];
      for (const s of sel) {
        for (const item of document.querySelectorAll(s)) {
          const text = item.textContent.trim();
          if (matchLanguage(text, prefs)) { item.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  function tryDisneyDOM(prefs) {
    try {
      const sel = ['.track-element,.btm-media-controls-subtitle [class*="track"]', '[class*="subtitle"] li,[class*="subtitle"] button', '[class*="caption"] li,[class*="caption"] button'];
      for (const s of sel) {
        for (const item of document.querySelectorAll(s)) {
          const text = item.textContent.trim();
          if (matchLanguage(text, prefs)) { item.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  function tryHuluDOM(prefs) {
    try {
      const sel = ['[class*="subtitle"] li,[class*="subtitle"] button', '[class*="cc"] li,[class*="cc"] button', '[class*="caption"] li,[class*="caption"] button'];
      for (const s of sel) {
        for (const item of document.querySelectorAll(s)) {
          const text = item.textContent.trim();
          if (matchLanguage(text, prefs)) { item.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  function tryCrunchyrollDOM(prefs) {
    try {
      const sel = ['[class*="subtitle"] span,[class*="subtitle"] button', '[class*="cc"] span,[class*="cc"] button', '[class*="caption"] li'];
      for (const s of sel) {
        for (const item of document.querySelectorAll(s)) {
          const text = item.textContent.trim();
          if (matchLanguage(text, prefs)) { item.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  // ─── Tier 4: Generic DOM scan ────────────────────────

  function tryGenericDOM(prefs) {
    try {
      const sel = ['[class*="subtitle"] span,[class*="subtitle"] button', '[class*="cc"] span,[class*="cc"] button', '[class*="caption"] span,[class*="caption"] button', '[aria-label*="subtitle"i] option,[aria-label*="subtitle"i] li'];
      for (const s of sel) {
        for (const item of document.querySelectorAll(s)) {
          const text = item.textContent.trim();
          if (text.length > 1 && text.length < 80 && matchLanguage(text, prefs)) { item.click(); return text; }
        }
      }
    } catch {}
    return null;
  }

  // ─── Main selection with exponential backoff ─────────

  function selectSubtitle(video) {
    if (!enabled || !video) { sendStatus('disabled'); return; }
    if (activeTracks.has(video)) return;

    activeTracks.set(video, '__pending__');
    const platform = detectPlatform();
    const prefs = languages.length ? languages : ['English'];
    let retries = 0;
    const delays = [0, 1000, 3000, 7000, 15000];

    function attempt() {
      if (!enabled) { activeTracks.delete(video); sendStatus('disabled'); return; }
      const result = tryPlatformAPI(video, platform, prefs) || tryTextTracks(video, prefs) || tryPlatformDOM(platform, prefs) || tryGenericDOM(prefs);
      if (result) {
        activeTracks.set(video, result);
        sendStatus('matched', result);
        return;
      }
      retries++;
      if (retries < delays.length) { sendStatus('searching'); setTimeout(attempt, delays[retries]); }
      else { activeTracks.set(video, 'not-found'); sendStatus('not-found'); }
    }

    if (video.readyState >= 1) attempt();
    else {
      video.addEventListener('loadedmetadata', attempt, { once: true });
      setTimeout(() => { if (activeTracks.get(video) === '__pending__') attempt(); }, 2000);
    }
  }

  // ─── Re-check on video source change ─────────────────

  function watchVideo(video) {
    let lastSrc = video.currentSrc || video.src;
    video.addEventListener('loadedmetadata', () => {
      const newSrc = video.currentSrc || video.src;
      if (newSrc !== lastSrc) { lastSrc = newSrc; activeTracks.delete(video); selectSubtitle(video); }
    }, { passive: true });
  }

  // ─── Messaging ───────────────────────────────────────

  function sendStatus(status, lang) {
    try { chrome.runtime.sendMessage({ type: 'SUBTITLE_STATUS', status, lang }); } catch {}
  }

  // ─── Storage & reactivity ────────────────────────────

  function loadPrefs(callback) {
    chrome.storage.sync.get({ enabled: true, languages: ['English'] }, (prefs) => {
      enabled = typeof prefs.enabled === 'boolean' ? prefs.enabled : true;
      languages = Array.isArray(prefs.languages) ? prefs.languages.filter(l => typeof l === 'string' && l.trim().length >= 2) : ['English'];
      if (!languages.length) languages = ['English'];
      if (callback) callback();
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled !== undefined) {
      const val = changes.enabled.newValue;
      enabled = typeof val === 'boolean' ? val : true;
      document.querySelectorAll('video').forEach(v => { activeTracks.delete(v); if (enabled) selectSubtitle(v); });
      if (!enabled) sendStatus('disabled');
    }
    if (changes.languages !== undefined) {
      const val = changes.languages.newValue;
      languages = Array.isArray(val) ? val.filter(l => typeof l === 'string' && l.trim().length >= 2) : ['English'];
      if (!languages.length) languages = ['English'];
      document.querySelectorAll('video').forEach(v => { activeTracks.delete(v); selectSubtitle(v); });
    }
  });

  // ─── Bootstrap ───────────────────────────────────────

  function init(video) {
    if (!video) return;
    loadPrefs(() => {
      selectSubtitle(video);
      watchVideo(video);
    });
  }

  const existingVideos = document.querySelectorAll('video');
  existingVideos.forEach(v => init(v));

  let observerTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      const videos = document.querySelectorAll('video');
      videos.forEach(v => { if (!activeTracks.has(v)) init(v); });
    }, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
