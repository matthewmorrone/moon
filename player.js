/* Central lyric/video player shared across song pages.
 * Features: play/pause, loop, mute, scroll follow, furigana toggle, jump-on-click toggle, keyboard shortcuts, tooltips.
 * Usage: include <script src="../player.js"></script> then call initLyricPlayer({ title:"...", video:"#bg-video", lyrics:"#lyrics-body" });
 */
(function(){
  const ICONS = {
    play: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    loop: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
    volumeOn: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    volumeOff: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    scrollFollow: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15l-5-5h3V9h4v3h3l-5 5z"/></svg>',
    scrollLocked: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>',
    furigana: '<svg width="20" height="20" viewBox="0 0 225 225"><g id="#000000ff"><path d=" M 75.22 19.24 C 81.08 18.14 87.40 19.30 92.39 22.61 C 100.91 27.97 105.12 39.30 102.07 48.90 C 99.33 58.40 89.97 65.64 80.01 65.48 C 72.15 65.72 64.26 61.61 60.10 54.91 C 55.60 48.11 55.11 38.89 58.82 31.65 C 62.01 25.29 68.24 20.60 75.22 19.24 Z"/><path d=" M 139.54 19.58 C 152.69 15.69 167.51 26.05 168.44 39.71 C 170.43 52.76 159.09 65.58 145.95 65.49 C 133.49 66.28 122.15 55.37 121.92 43.00 C 121.37 32.34 129.13 22.01 139.54 19.58 Z"/><path d=" M 103.17 75.01 C 109.39 75.00 115.61 74.99 121.84 75.01 C 121.82 81.27 121.84 87.54 121.83 93.81 C 140.58 93.81 159.32 93.82 178.07 93.80 C 178.08 99.99 178.07 106.18 178.08 112.37 C 172.08 112.31 166.07 112.41 160.07 112.31 C 155.95 131.30 142.43 146.25 128.64 159.12 C 143.83 171.15 158.85 183.40 174.14 195.30 C 170.35 200.29 166.23 205.02 162.53 210.08 C 146.48 197.02 130.16 184.28 114.11 171.21 C 97.97 184.21 81.84 197.21 65.57 210.04 C 61.78 205.12 58.01 200.15 53.96 195.44 C 69.34 183.49 84.41 171.12 99.66 159.00 C 87.92 148.43 77.26 136.24 70.39 121.90 C 77.58 121.90 84.77 121.91 91.97 121.90 C 98.15 131.21 105.68 139.58 114.00 147.04 C 124.67 137.24 135.03 126.12 140.17 112.34 C 109.09 112.38 78.01 112.32 46.92 112.37 C 46.93 106.18 46.92 99.99 46.93 93.80 C 65.67 93.82 84.42 93.81 103.17 93.81 C 103.17 87.54 103.17 81.27 103.17 75.01 Z"/></g></svg>',
    jump: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 16c4-8 12-8 16 0" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="18,16 22,16 20,20" fill="currentColor"/></svg>'
  };

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function formatTime(t){ const m=Math.floor(t/60); const s=String(Math.floor(t%60)).padStart(2,'0'); return `${m}:${s}`; }

  function buildButton(action, label){
    const btn = document.createElement('button');
    btn.type='button';
    btn.className='control-btn';
    btn.dataset.action = action;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed','false');
    btn.innerHTML = ICONS[action] || '';
    return btn;
  }

  function initLyricPlayer(cfg){
    const video = typeof cfg.video === 'string' ? qs(cfg.video) : cfg.video;
    const lyricsBody = typeof cfg.lyrics === 'string' ? qs(cfg.lyrics) : cfg.lyrics;
    if(!video || !lyricsBody) { console.warn('Lyric player: missing video or lyrics container'); return; }
    const container = lyricsBody.closest('.container') || document.body;
    let controls = container.querySelector('.main-controls, .controls');
    if(!controls){ controls = document.createElement('div'); controls.className='controls main-controls'; container.insertBefore(controls, lyricsBody); }
    // Clear existing to avoid duplicates
    controls.innerHTML='';
    const hasRuby = !!lyricsBody.querySelector('ruby');
    const buttonsSpec = [
      {action:'play', label:'Play/Pause'},
      {action:'loop', label:'Toggle Loop'},
      {action:'mute', label:'Mute/Unmute'},
      {action:'scroll', label:'Toggle Scroll Follow', active:true},
      hasRuby ? {action:'furigana', label:'Toggle Furigana', active:true} : null,
      {action:'jump', label:'Toggle Lyric Jump', active:true}
    ].filter(Boolean);
    const state = {
      scrollFollow:true,
      jumpOnClick:true,
      pointerCoarse: window.matchMedia('(pointer: coarse)').matches,
      currentRowIndex:-1
    };
    const btnMap = {};
    buttonsSpec.forEach(spec=>{
      const btn = buildButton(spec.action, spec.label);
      controls.appendChild(btn);
      btnMap[spec.action]=btn;
      if(spec.active){ btn.classList.add('active'); btn.setAttribute('aria-pressed','true'); }
    });
    function updatePlay(){ const playing=!video.paused; const b=btnMap.play; if(b){ b.innerHTML = playing?ICONS.pause:ICONS.play; b.classList.toggle('active', playing); b.setAttribute('aria-pressed', playing);} }
    function updateLoop(){ const b=btnMap.loop; if(b){ b.classList.toggle('active', video.loop); b.setAttribute('aria-pressed', video.loop);} }
    function updateMute(){ const b=btnMap.mute; if(b){ b.innerHTML = video.muted?ICONS.volumeOff:ICONS.volumeOn; b.classList.toggle('active', !video.muted); b.setAttribute('aria-pressed', !video.muted);} }
    function updateScroll(){ const b=btnMap.scroll; if(b){ b.innerHTML = state.scrollFollow?ICONS.scrollFollow:ICONS.scrollLocked; b.classList.toggle('active', state.scrollFollow); b.setAttribute('aria-pressed', state.scrollFollow);} }
    function updateFurigana(){ const b=btnMap.furigana; if(b){ const visible = !document.body.classList.contains('hide-furigana'); b.classList.toggle('active', visible); b.setAttribute('aria-pressed', visible);} }
    function updateJump(){ const b=btnMap.jump; if(b){ b.classList.toggle('active', state.jumpOnClick); b.setAttribute('aria-pressed', state.jumpOnClick);} }

    function togglePlay(){ if(video.paused){ video.play(); } else { video.pause(); } }
    function toggleLoop(){ video.loop = !video.loop; updateLoop(); }
    function toggleMute(){ video.muted = !video.muted; updateMute(); }
    function toggleScroll(){ state.scrollFollow = !state.scrollFollow; updateScroll(); }
    function toggleFurigana(){ document.body.classList.toggle('hide-furigana'); updateFurigana(); }
    function toggleJump(){ state.jumpOnClick = !state.jumpOnClick; updateJump(); }

    Object.assign(window, { lyricPlayer:{ video, state } });

    // Highlighting logic
    function updateTime(){
      const t = video.currentTime;
      document.title = `(${formatTime(t)}) - ${cfg.title || document.title}`;
      let active = null;
      const rows = qsa('.lyric-row', lyricsBody);
      rows.forEach((row,i)=>{
        const start = parseFloat(row.dataset.startTime);
        const end = parseFloat(row.dataset.endTime);
        const inside = t >= start && t <= end;
        if(inside){ active = row; state.currentRowIndex = i; row.classList.add('highlight-line'); }
        else { row.classList.remove('highlight-line'); }
      });
      if(active && state.scrollFollow){
        active.scrollIntoView({behavior: state.pointerCoarse?'auto':'smooth', block:'center'});
      }
    }
    let lastTU=0; function throttled(){ const now=Date.now(); if(now-lastTU> (state.pointerCoarse?200:100)){ lastTU=now; updateTime(); } }
    video.addEventListener('timeupdate', state.pointerCoarse?throttled:updateTime);
    video.addEventListener('play', updatePlay); video.addEventListener('pause', updatePlay);

    // Button events (event delegation)
    controls.addEventListener('click', e=>{
      const btn = e.target.closest('button.control-btn'); if(!btn) return; const action=btn.dataset.action; switch(action){
        case 'play': togglePlay(); break;
        case 'loop': toggleLoop(); break;
        case 'mute': toggleMute(); break;
        case 'scroll': toggleScroll(); break;
        case 'furigana': toggleFurigana(); break;
        case 'jump': toggleJump(); break;
      }
    });

    // Lyric row click
    lyricsBody.addEventListener('click', e=>{
      const row = e.target.closest('.lyric-row'); if(!row) return; if(!state.jumpOnClick) return; const start=parseFloat(row.dataset.startTime); if(!isNaN(start)){ video.currentTime = start; if(video.paused) video.play(); }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e=>{
      const tag = e.target.tagName; if(tag==='INPUT'||tag==='TEXTAREA') return;
      if(['Space','Enter','NumpadEnter'].includes(e.code)){ e.preventDefault(); togglePlay(); }
      else if(e.code==='ArrowRight'){ e.preventDefault(); const rows=qsa('.lyric-row', lyricsBody); if(state.currentRowIndex < rows.length-1){ state.currentRowIndex++; video.currentTime = parseFloat(rows[state.currentRowIndex].dataset.startTime); } }
      else if(e.code==='ArrowLeft'){ e.preventDefault(); const rows=qsa('.lyric-row', lyricsBody); if(state.currentRowIndex > 0){ state.currentRowIndex--; video.currentTime = parseFloat(rows[state.currentRowIndex].dataset.startTime); } }
      else if(e.code==='ArrowUp'){ e.preventDefault(); toggleMute(); }
      else if(e.code==='ArrowDown'){ e.preventDefault(); toggleLoop(); }
      else if(e.code==='KeyS'){ e.preventDefault(); toggleScroll(); }
      else if(e.code==='KeyF'){ e.preventDefault(); if(btnMap.furigana) toggleFurigana(); }
      else if(e.code==='KeyJ'){ e.preventDefault(); toggleJump(); }
    });

    // Tooltip (delegated)
    let tooltipEl=null; let tooltipTarget=null;
    function showTooltip(target){
      hideTooltip();
      // Use both legacy and new class names for broad styling support
      const div=document.createElement('div'); div.className='tooltip-box tooltip visible';
      const { meaning, grammar, kana, romaji, kanji, lyricNote } = target.dataset;
      let h4 = kanji ? `<span class="kanji-color">${kanji}</span>` : target.textContent.trim();
      let html = `<h4>${h4}</h4>`;
      if(kana || romaji){ html += '<div class="kana-romaji">'; if(kana) html+=`<p class="kana-display">${kana}</p>`; if(romaji) html+=`<p>${romaji}</p>`; html+='</div>'; }
      if(meaning) html+=`<p><strong>Meaning:</strong> ${meaning}</p>`;
      if(grammar) html+=`<p><strong>Grammar:</strong> ${grammar}</p>`;
      if(lyricNote) html+=`<p class="lyric-note">${lyricNote}</p>`;
      div.innerHTML = html; document.body.appendChild(div); tooltipEl=div; tooltipTarget=target;
      const r = target.getBoundingClientRect();
      let left = r.left + r.width/2 - div.offsetWidth/2; let top = r.top - div.offsetHeight - 10;
      if(left<10) left=10; if(left+div.offsetWidth>window.innerWidth-10) left=window.innerWidth-div.offsetWidth-10;
      if(top<10) top = r.bottom + 10;
      div.style.position='absolute'; div.style.left = `${left+window.scrollX}px`; div.style.top = `${top+window.scrollY}px`;
    }
    function hideTooltip(){ if(tooltipEl){ tooltipEl.remove(); tooltipEl=null; tooltipTarget=null; } }
    document.addEventListener('mousemove', e=>{ if(tooltipTarget && !e.target.closest('.word-tooltip')) hideTooltip(); });
    document.addEventListener('mouseover', e=>{ const w = e.target.closest('.word-tooltip'); if(w) showTooltip(w); });
    document.addEventListener('scroll', ()=>{ if(tooltipEl) hideTooltip(); }, true);

    // Cross-highlighting between Japanese word groups and translation phrases
    lyricsBody.addEventListener('mouseover', e => {
      const group = e.target.closest('.word-group');
      const phrase = e.target.closest('.translation-phrase');
      if(group){
        const id = group.dataset.groupId; if(!id) return;
        group.classList.add('highlight-jp-group');
        const en = lyricsBody.querySelector(`.translation-phrase[data-group-id="${id}"]`);
        if(en) en.classList.add('highlight-en-phrase');
        if(!tooltipEl){
          const tt = group.querySelector('.word-tooltip');
          if(tt) showTooltip(tt);
        }
      } else if(phrase){
        const id = phrase.dataset.groupId; if(!id) return;
        phrase.classList.add('highlight-en-phrase');
        const jp = lyricsBody.querySelector(`.word-group[data-group-id="${id}"]`);
        if(jp) jp.classList.add('highlight-jp-group');
        if(!tooltipEl && jp){
          const tt = jp.querySelector('.word-tooltip');
          if(tt) showTooltip(tt);
        }
      }
    });
    lyricsBody.addEventListener('mouseout', e => {
      const group = e.target.closest('.word-group');
      const phrase = e.target.closest('.translation-phrase');
      if(group){
        const id = group.dataset.groupId; group.classList.remove('highlight-jp-group');
        if(id){ const en = lyricsBody.querySelector(`.translation-phrase[data-group-id="${id}"]`); if(en) en.classList.remove('highlight-en-phrase'); }
      } else if(phrase){
        const id = phrase.dataset.groupId; phrase.classList.remove('highlight-en-phrase');
        if(id){ const jp = lyricsBody.querySelector(`.word-group[data-group-id="${id}"]`); if(jp) jp.classList.remove('highlight-jp-group'); }
      }
    });

    // Initial updates
    updatePlay(); updateLoop(); updateMute(); updateScroll(); updateFurigana(); updateJump(); updateTime();
  }

  window.initLyricPlayer = initLyricPlayer;
})();