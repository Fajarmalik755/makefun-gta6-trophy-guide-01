// Vice City Platinum Playbook — tracker logic.
// Loads app/data/trophies.json, keeps progress in localStorage, and renders
// the checklist, the detail guide pane, the roadmap, the missables page and
// the sources page. No network calls besides the local data file.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'vcpp-progress-v1';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };

const CHIPS = [
  { key: 'all', label: 'All 55' },
  { key: 'platinum', label: 'Platinum' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'bronze', label: 'Bronze' },
  { key: 'story', label: 'Story' },
  { key: 'missable', label: 'Missable' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'earned', label: 'Earned' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'unconfirmed', label: 'Unconfirmed' },
];

let data = null;
let state = loadState();
let activeChip = 'all';
let query = '';
let spoilerOn = false;
let selectedId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: {}, counts: {} };
    const parsed = JSON.parse(raw);
    return { earned: parsed.earned || {}, counts: parsed.counts || {} };
  } catch {
    return { earned: {}, counts: {} };
  }
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

function isEarned(t) { return !!state.earned[t.id]; }
function countValue(t) { return state.counts[t.id] || 0; }

function setEarned(t, value) {
  if (value) state.earned[t.id] = true; else delete state.earned[t.id];
  saveState();
  renderAll();
}

function setCount(t, value) {
  const clamped = Math.max(0, Math.min(t.count, value));
  state.counts[t.id] = clamped;
  // Reaching the target earns the trophy; dropping below it un-earns it.
  if (clamped >= t.count) state.earned[t.id] = true;
  else if (state.earned[t.id] && clamped < t.count) delete state.earned[t.id];
  saveState();
  renderAll();
}

function trophyHidden(t) { return t.hidden && spoilerOn && !isEarned(t); }

function matchesChip(t) {
  switch (activeChip) {
    case 'all': return true;
    case 'platinum': case 'gold': case 'silver': case 'bronze': return t.grade === activeChip;
    case 'story': return t.kind === 'story';
    case 'missable': return t.missable === true;
    case 'collectibles': return t.kind === 'collectibles';
    case 'activities': return t.kind === 'activities';
    case 'hidden': return t.hidden === true;
    case 'earned': return isEarned(t);
    case 'remaining': return !isEarned(t);
    case 'unconfirmed': return t.unconfirmed === true;
    default: return true;
  }
}

function matchesQuery(t) {
  if (!query) return true;
  const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.kind || '')).toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
}

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderProgress() {
  const earned = data.trophies.filter(isEarned).length;
  const total = data.trophies.length;
  const pct = Math.round((earned / total) * 100);
  document.getElementById('earnedLine').textContent = earned + ' / ' + total + ' earned';
  document.getElementById('percentLine').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const got = data.trophies.filter((t) => t.grade === g && isEarned(t)).length;
    const all = data.trophies.filter((t) => t.grade === g).length;
    return GRADE_LABEL[g] + ' ' + got + '/' + all;
  });
  document.getElementById('gradeCounts').textContent = parts.join('  ·  ');
}

function renderChips() {
  const box = document.getElementById('chips');
  // Chip counts are computed against the current data, not hard-coded.
  box.innerHTML = CHIPS.map((c) => {
    const n = c.key === 'all' ? data.trophies.length : data.trophies.filter((t) => {
      const keep = activeChip; activeChip = c.key; const ok = matchesChip(t); activeChip = keep; return ok;
    }).length;
    return '<button type="button" class="chip' + (c.key === activeChip ? ' active' : '') + '" data-chip="' + c.key + '">' + esc(c.label) + ' (' + n + ')</button>';
  }).join('');
  box.querySelectorAll('[data-chip]').forEach((btn) => {
    btn.addEventListener('click', () => { activeChip = btn.dataset.chip; renderAll(); });
  });
}

function renderList() {
  const list = document.getElementById('trophyList');
  const shown = data.trophies.filter((t) => matchesChip(t) && matchesQuery(t));
  document.getElementById('resultCount').textContent = shown.length + ' of ' + data.trophies.length + ' trophies shown';
  list.innerHTML = shown.map((t) => {
    const hidden = trophyHidden(t);
    const earned = isEarned(t);
    const title = hidden ? 'Hidden trophy — earn it to reveal its name' : esc(t.name);
    const desc = hidden ? 'Its name and description stay hidden until you earn it.' : esc(t.description);
    const stepper = t.count
      ? '<span class="stepper"><button type="button" data-dec="' + t.id + '" aria-label="Decrease count">−</button><span>' + countValue(t) + ' / ' + t.count + ' ' + esc(t.countLabel || '') + '</span><button type="button" data-inc="' + t.id + '" aria-label="Increase count">+</button></span>'
      : '';
    const flags = [
      t.missable ? '<span class="flag missable-flag">MISSABLE</span>' : '',
      t.unconfirmed ? '<span class="flag unconfirmed-flag">UNCONFIRMED</span>' : '',
      t.hidden ? '<span class="flag hidden-flag">HIDDEN</span>' : '',
    ].join('');
    return '<li class="trophy' + (earned ? ' earned' : '') + (selectedId === t.id ? ' selected' : '') + '" data-id="' + t.id + '">' +
      '<label class="check"><input type="checkbox" data-check="' + t.id + '"' + (earned ? ' checked' : '') + '><span class="box" aria-hidden="true"></span></label>' +
      '<div class="trophy-body"><div class="trophy-top"><span class="grade grade-' + t.grade + '">' + GRADE_LABEL[t.grade] + '</span>' +
      '<span class="kind">' + esc(KIND_LABEL[t.kind] || t.kind) + '</span>' + flags + '</div>' +
      '<h3>' + title + '</h3><p>' + desc + '</p>' + stepper + '</div></li>';
  }).join('') || '<li class="no-results">No trophies match this filter and search.</li>';

  list.querySelectorAll('[data-check]').forEach((box) => {
    box.addEventListener('change', () => {
      const t = data.trophies.find((x) => x.id === Number(box.dataset.check));
      setEarned(t, box.checked);
    });
  });
  list.querySelectorAll('[data-inc]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const t = data.trophies.find((x) => x.id === Number(btn.dataset.inc));
      setCount(t, countValue(t) + 1);
    });
  });
  list.querySelectorAll('[data-dec]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const t = data.trophies.find((x) => x.id === Number(btn.dataset.dec));
      setCount(t, countValue(t) - 1);
    });
  });
  list.querySelectorAll('.trophy[data-id]').forEach((row) => {
    row.addEventListener('click', (ev) => {
      if (ev.target.closest('button') || ev.target.closest('input') || ev.target.closest('.stepper')) return;
      selectedId = Number(row.dataset.id);
      renderList();
      renderDetail();
    });
  });
}

function renderDetail() {
  const pane = document.getElementById('detailPane');
  const t = data.trophies.find((x) => x.id === selectedId);
  if (!t) {
    pane.innerHTML = '<p class="detail-empty">Pick a trophy on the left to read its full guide, counts and source.</p>';
    return;
  }
  const hidden = trophyHidden(t);
  const body = hidden
    ? '<p class="spoiler-note">Spoiler shield is on. Earn this trophy in-game to reveal its name, description and guide here.</p>'
    : '<h3>' + esc(t.name) + '</h3>' +
      '<p class="detail-desc">' + esc(t.description) + '</p>' +
      (t.missable ? '<p class="warning">MISSABLE — the only missable trophy in the game. Read the guide carefully before Chapter 1 ends.</p>' : '') +
      (t.unconfirmed ? '<p class="warning">UNCONFIRMED — no reliable method has been published yet. Do not chase this one until a trusted guide confirms how it triggers.</p>' : '') +
      '<p class="guide">' + esc(t.guide) + '</p>' +
      (t.count ? '<p class="count-line">Progress: ' + countValue(t) + ' / ' + t.count + ' ' + esc(t.countLabel || '') + '</p>' : '') +
      '<p class="source-line">Source: <a href="' + esc(t.sourceUrl) + '" target="_blank" rel="noopener">' + esc(t.source) + '</a></p>';
  pane.innerHTML = '<div class="detail-head"><span class="grade grade-' + t.grade + '">' + GRADE_LABEL[t.grade] + '</span>' +
    '<span class="kind">' + esc(KIND_LABEL[t.kind] || t.kind) + '</span></div>' + body +
    '<button type="button" class="earn-btn" data-earn="' + t.id + '">' + (isEarned(t) ? 'Mark as not earned' : 'Mark as earned') + '</button>';
  pane.querySelector('[data-earn]').addEventListener('click', () => setEarned(t, !isEarned(t)));
}

function renderRoadmap() {
  const box = document.getElementById('roadmapList');
  box.innerHTML = data.roadmap.map((stage) => {
    const members = data.trophies.filter((t) => t.roadmap === stage.stage);
    const done = members.filter(isEarned).length;
    return '<li><h3>' + esc(stage.title) + ' <span class="stage-count">' + done + '/' + members.length + ' trophies</span></h3><p>' + esc(stage.text) + '</p></li>';
  }).join('');
}

function renderMissables() {
  const box = document.getElementById('missableList');
  const missable = data.trophies.filter((t) => t.missable);
  box.innerHTML = missable.map((t) => {
    const hidden = trophyHidden(t);
    return '<article class="missable-card"><h3>' + (hidden ? 'Hidden trophy' : esc(t.name)) + '</h3>' +
      '<p>' + esc(t.description) + '</p><p>' + esc(t.guide) + '</p>' +
      '<p class="source-line">Source: <a href="' + esc(t.sourceUrl) + '" target="_blank" rel="noopener">' + esc(t.source) + '</a></p></article>';
  }).join('');
}

function renderSources() {
  const box = document.getElementById('sourceList');
  box.innerHTML = data.sources.map((s) =>
    '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a> — ' + esc(s.note) + '</li>'
  ).join('');
}

function renderAll() {
  renderProgress();
  renderChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vice-city-platinum-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || typeof parsed !== 'object') throw new Error('bad file');
      state = { earned: parsed.earned || {}, counts: parsed.counts || {} };
      saveState();
      renderAll();
    } catch {
      alert('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
}

function wireControls() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === tab));
      document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
    });
  });
  document.getElementById('searchInput').addEventListener('input', (ev) => {
    query = ev.target.value.trim();
    renderList();
  });
  document.getElementById('spoilerToggle').addEventListener('change', (ev) => {
    spoilerOn = ev.target.checked;
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (ev) => {
    if (ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and counters?')) {
      state = { earned: {}, counts: {} };
      selectedId = null;
      saveState();
      renderAll();
    }
  });
}

fetch(DATA_URL)
  .then((res) => { if (!res.ok) throw new Error('data failed to load'); return res.json(); })
  .then((json) => {
    data = json;
    wireControls();
    renderSources();
    renderAll();
  })
  .catch(() => {
    document.getElementById('trophyList').innerHTML = '<li class="no-results">The trophy data could not be loaded. Serve the app folder over HTTP and reload.</li>';
  });
