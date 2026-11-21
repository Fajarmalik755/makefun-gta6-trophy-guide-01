// Sunset Strip Trophy Guide — tracker logic. Loads only app/data/trophies.json
// (a file of this app, never the network) and keeps progress in localStorage.
// No other requests are made at run time.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'sunset-strip-gta6-progress-v1';

const ROADMAP = [
  {
    title: 'Story first — Chapters 1 to 5',
    time: 'About 60 to 80 hours',
    points: [
      'Play the story straight through. All 12 story trophies pop on their own: the four chapter trophies, the six mission trophies (Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown, Operation Savage Glory), the opening mission and the final mission.',
      'Scan vehicles with the WAiNK phone app and study animals with binoculars as you travel — 200 of 277 base vehicles and 100 of 255 animals count toward 100% later.',
      'Do the one missable step in Chapter 1: meditate on Jason\u2019s house balcony after Down to Earth (Positive Mental Attitude).',
      'Keep a manual save at the start and end of every chapter. There is no mission replay and no new game plus.',
    ],
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    title: 'The 100% checklist',
    time: 'About 100 hours, after the story',
    points: [
      'Open Progress > Stats > 100% Completion once it unlocks after the story and work down it: optional missions, stunts, shooting ranges, drone races, gang operations, bank vaults, WAiNK locations, card sets, meditations and challenges.',
      'This stage earns the gold A Long Road plus most silver and bronze trophies: Cunning Stunts, The Shootist, Top Fun, Don\u2019t Touch My Deck, You WAiNKer!, Maximum Withdrawal, Strangers & Freaks and the count trophies.',
      'Progress made during the story already counts, so this stage is mostly finishing what you started.',
    ],
    ids: [14, 15, 17, 18, 25, 30, 31, 32, 40, 42, 43],
  },
  {
    title: 'Cleanup — strangers, side missions and odd jobs',
    time: 'About 10 hours',
    points: [
      'Finish the stranger and side-mission strands: Andy, Kenton, Billy, Randy and Tyrone, plus the 8 counting stranger strands.',
      'Mop up the open-world trophies: partner robberies, Combat Focus, the VCIA plane, the tank, the bowling alley, the cocktail on Ocean Beach and the money trophies.',
      'The platinum, Vice Got a Price!, pops the moment the 54th other trophy lands.',
    ],
    ids: [16, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 33, 34, 35, 36, 37, 38, 39, 41, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 1],
  },
];

let trophies = [];
let state = loadState();
let selectedId = null;
let revealed = new Set();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], counts: {} };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
    };
  } catch {
    return { earned: [], counts: {} };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function earnedSet() {
  return new Set(state.earned);
}

function isEarned(id) {
  return earnedSet().has(id);
}

function toggleEarned(id) {
  const set = earnedSet();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  state.earned = [...set].sort((a, b) => a - b);
  saveState();
  renderAll();
}

function countOf(trophy) {
  if (!trophy.count) return 0;
  return Math.min(trophy.count, Math.max(0, Number(state.counts[trophy.id]) || 0));
}

function setCount(id, value, max) {
  state.counts[id] = Math.min(max, Math.max(0, value));
  saveState();
  renderAll();
}

function byId(id) {
  return trophies.find((t) => t.id === id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function spoilerOn() {
  return document.getElementById('spoilerToggle').checked;
}

function isVeiled(trophy) {
  return trophy.hidden && spoilerOn() && !isEarned(trophy.id) && !revealed.has(trophy.id);
}

function visibleTrophies() {
  const query = document.getElementById('search').value.trim().toLowerCase();
  const kind = document.getElementById('kindFilter').value;
  const grade = document.getElementById('gradeFilter').value;
  const hideEarned = document.getElementById('hideEarned').checked;
  return trophies.filter((t) => {
    if (hideEarned && isEarned(t.id)) return false;
    if (kind === 'missable' && !t.missable) return false;
    if (kind && kind !== 'missable' && t.kind !== kind) return false;
    if (grade && t.grade !== grade) return false;
    if (query) {
      const hay = [t.name, t.description, t.guide, t.kind, t.missable_window || '']
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const done = state.earned.length;
  document.getElementById('progressText').textContent = `${done} / ${total} earned`;
  document.getElementById('progressPct').textContent = total ? `${Math.round((done / total) * 100)}%` : '0%';
  document.getElementById('progressFill').style.width = total ? `${(done / total) * 100}%` : '0%';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  document.getElementById('progressGrades').textContent = grades
    .map((g) => {
      const inGrade = trophies.filter((t) => t.grade === g);
      const got = inGrade.filter((t) => isEarned(t.id)).length;
      return `${gradeLabel(g)} ${got}/${inGrade.length}`;
    })
    .join(' · ');
}

function renderList() {
  const list = document.getElementById('trophyList');
  const shown = visibleTrophies();
  document.getElementById('listHint').textContent =
    shown.length === trophies.length
      ? `Showing all ${trophies.length} trophies. Tap one to open its guide.`
      : `Showing ${shown.length} of ${trophies.length} trophies.`;
  list.innerHTML = '';
  for (const t of shown) {
    const li = document.createElement('li');
    li.dataset.id = String(t.id);
    if (selectedId === t.id) li.classList.add('selected');
    if (isEarned(t.id)) li.classList.add('earned');
    const veiled = isVeiled(t);
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'checkbox';
    check.checked = isEarned(t.id);
    check.setAttribute('aria-label', `Mark ${veiled ? 'hidden trophy' : t.name} earned`);
    check.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(t.id);
    });
    const row = document.createElement('div');
    row.className = 'row1';
    const name = document.createElement('span');
    name.className = 'tname';
    name.textContent = veiled ? 'Hidden trophy' : t.name;
    const grade = document.createElement('span');
    grade.className = `grade ${t.grade}`;
    grade.textContent = t.grade;
    row.append(check, name, grade);
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = veiled ? 'Veiled until earned or revealed — spoiler shield is on.' : t.description;
    if (veiled) desc.classList.add('veiled');
    li.append(row, desc);
    if (t.missable && !veiled) {
      const flag = document.createElement('span');
      flag.className = 'flag';
      flag.textContent = 'MISSABLE';
      li.append(flag);
    }
    if (t.hidden && !veiled) {
      const flag = document.createElement('span');
      flag.className = 'flag hidden-flag';
      flag.textContent = 'Hidden on PSN';
      li.append(flag);
    }
    li.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    list.append(li);
  }
}

function renderDetail() {
  const box = document.getElementById('detail');
  const t = selectedId == null ? null : byId(selectedId);
  box.innerHTML = '';
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy on the left to read its guide, sources and counts.';
    box.append(p);
    return;
  }
  if (isVeiled(t)) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden trophy';
    const p = document.createElement('p');
    p.className = 'veiled';
    p.textContent = 'This trophy is hidden on PlayStation until you earn it, and the spoiler shield is on. Reveal it to read its name, description and guide — or earn it first and it unveils itself.';
    const btn = document.createElement('button');
    btn.className = 'earn-btn';
    btn.type = 'button';
    btn.textContent = 'Reveal this trophy';
    btn.addEventListener('click', () => {
      revealed.add(t.id);
      renderList();
      renderDetail();
    });
    box.append(h, p, btn);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = t.description;
  const meta = document.createElement('div');
  meta.className = 'meta';
  const pills = [
    `${gradeLabel(t.grade)} trophy`,
    `Kind: ${t.kind}`,
    t.hidden ? 'Hidden on PSN' : 'Visible on PSN',
  ];
  if (t.missable) pills.push(`Missable — ${t.missable_window || 'see guide'}`);
  for (const label of pills) {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = label;
    meta.append(pill);
  }
  const guide = document.createElement('div');
  guide.className = 'guide-text';
  for (const para of String(t.guide).split('\n\n')) {
    const p = document.createElement('p');
    p.textContent = para;
    guide.append(p);
  }
  box.append(h, official, meta, guide);
  if (t.count) {
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease count');
    minus.addEventListener('click', () => setCount(t.id, countOf(t) - 1, t.count));
    const label = document.createElement('span');
    label.className = 'count';
    label.textContent = `${countOf(t)} / ${t.count} ${t.count_label || ''}`.trim();
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase count');
    plus.addEventListener('click', () => setCount(t.id, countOf(t) + 1, t.count));
    stepper.append(minus, label, plus);
    box.append(stepper);
  }
  if (Array.isArray(t.sources) && t.sources.length) {
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources) {
      const li = document.createElement('li');
      if (s.url) {
        const a = document.createElement('a');
        a.href = s.url;
        a.textContent = s.name;
        a.target = '_blank';
        a.rel = 'noopener';
        li.append(a);
      } else {
        li.textContent = s.name;
      }
      ul.append(li);
    }
    box.append(sh, ul);
  }
  if (t.dispute) {
    const d = document.createElement('div');
    d.className = 'dispute';
    const strong = document.createElement('strong');
    strong.textContent = 'Sources disagree: ';
    const span = document.createElement('span');
    span.textContent = t.dispute;
    d.append(strong, span);
    box.append(d);
  }
  if (t.unconfirmed) {
    const u = document.createElement('div');
    u.className = 'unconfirmed';
    const strong = document.createElement('strong');
    strong.textContent = 'Unconfirmed: ';
    const span = document.createElement('span');
    span.textContent = t.unconfirmed;
    u.append(strong, span);
    box.append(u);
  }
  const earn = document.createElement('button');
  earn.className = `earn-btn${isEarned(t.id) ? ' earned' : ''}`;
  earn.type = 'button';
  earn.textContent = isEarned(t.id) ? '✓ Earned — tap to unmark' : 'Mark as earned';
  earn.addEventListener('click', () => toggleEarned(t.id));
  box.append(earn);
}

function renderRoadmap() {
  const host = document.getElementById('roadmapStages');
  host.innerHTML = '';
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `${stage.title} — ${stage.time}`;
    li.append(h);
    const ul = document.createElement('ul');
    for (const point of stage.points) {
      const p = document.createElement('li');
      p.textContent = point;
      ul.append(p);
    }
    li.append(ul);
    const names = stage.ids.map((id) => byId(id)).filter(Boolean);
    const earnedHere = names.filter((t) => isEarned(t.id)).length;
    const tally = document.createElement('p');
    tally.className = 'cite';
    tally.textContent = `Trophies in this stage: ${earnedHere}/${names.length} earned — ${names.map((t) => t.name).join(', ')}`;
    li.append(tally);
    host.append(li);
  }
}

function renderMissables() {
  const host = document.getElementById('missableList');
  host.innerHTML = '';
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = document.createElement('div');
    card.className = 'detail';
    card.style.position = 'static';
    card.style.marginBottom = '12px';
    const h = document.createElement('h3');
    h.textContent = `${t.name} — ${gradeLabel(t.grade)}`;
    const p = document.createElement('p');
    p.textContent = t.missable_window || '';
    const g = document.createElement('p');
    g.textContent = t.guide;
    card.append(h, p, g);
    host.append(card);
  }
  const note = document.createElement('p');
  note.className = 'cite';
  note.textContent = 'Every other trophy stays earnable in free roam after the story, including all side-mission and stranger trophies — the guides for Andy, Kenton, Billy, Randy and Tyrone all say the strands stay available after the story ends.';
  host.append(note);
}

function renderSources() {
  const host = document.getElementById('sourceList');
  host.innerHTML = '';
  const seen = new Map();
  for (const t of trophies) {
    for (const s of t.sources || []) {
      if (!seen.has(s.name)) seen.set(s.name, s);
    }
  }
  for (const s of seen.values()) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
    } else {
      li.textContent = s.name;
    }
    const count = trophies.filter((t) => (t.sources || []).some((x) => x.name === s.name)).length;
    const span = document.createElement('span');
    span.textContent = ` — cited by ${count} trophy guide${count === 1 ? '' : 's'}`;
    li.append(span);
    host.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderSources();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sunset-strip-gta6-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const earned = Array.isArray(parsed.earned) ? parsed.earned.filter((id) => byId(id)) : [];
      const counts = {};
      for (const [id, value] of Object.entries(parsed.counts || {})) {
        const t = byId(Number(id));
        if (t && t.count) counts[id] = Math.min(t.count, Math.max(0, Number(value) || 0));
      }
      state = { earned, counts };
      saveState();
      renderAll();
    } catch {
      alert('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
}

function wireTabs() {
  for (const button of document.querySelectorAll('#tabs .tab')) {
    button.addEventListener('click', () => {
      for (const b of document.querySelectorAll('#tabs .tab')) b.classList.remove('active');
      for (const p of document.querySelectorAll('main .panel')) p.classList.remove('active');
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== document.getElementById('search')) {
      event.preventDefault();
      document.getElementById('search').focus();
    }
  });
}

async function init() {
  const response = await fetch(DATA_URL);
  const data = await response.json();
  trophies = data.trophies || data;
  wireTabs();
  for (const id of ['search', 'kindFilter', 'gradeFilter', 'hideEarned', 'spoilerToggle']) {
    document.getElementById(id).addEventListener('input', () => {
      renderList();
      renderDetail();
    });
  }
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
  selectedId = trophies.length ? trophies[0].id : null;
  renderAll();
}

init();
