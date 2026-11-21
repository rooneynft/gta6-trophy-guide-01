// Leonida Platinum — GTA VI trophy guide & tracker. Static, offline, no build step.
// Data: data/trophies.json (55 official trophies + numbered cited claims) and
// data/roadmap.json (platinum roadmap stages). Progress lives in localStorage.
const TROPHIES_URL = 'data/trophies.json';
const ROADMAP_URL = 'data/roadmap.json';
const EARNED_KEY = 'leonida-platinum-v3-earned';
const SPOILER_KEY = 'leonida-platinum-v3-spoiler';
const COUNTS_KEY = 'leonida-platinum-v3-counts';

const state = {
  trophies: [],
  sites: {},
  readDate: '',
  stages: [],
  earned: new Set(),
  counts: {},
  spoiler: false,
  kind: 'all',
  onlyMissable: false,
  query: '',
  selectedId: 33,
  view: 'tracker',
};

const $ = (id) => document.getElementById(id);
const KIND_LABELS = { all: 'All', story: 'Story', missable: 'Missable', collectible: 'Collectibles', activity: 'Activities', misc: 'Misc' };
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  const earned = readJson(EARNED_KEY, []);
  state.earned = new Set(earned.filter((id) => Number.isInteger(id)));
  state.spoiler = localStorage.getItem(SPOILER_KEY) === '1';
  const counts = readJson(COUNTS_KEY, {});
  state.counts = counts && typeof counts === 'object' ? counts : {};
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
}

function saveCounts() {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(state.counts));
}

function findTrophy(id) {
  return state.trophies.find((t) => t.id === id);
}

function siteName(code) {
  return state.sites[code] ? state.sites[code].site : code;
}

function siteUrl(code) {
  return state.sites[code] ? state.sites[code].url : null;
}

function spoilerHides(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sourceChips(codes) {
  return codes.map((code) => '<span class="src">' + escapeHtml(siteName(code)) + '</span>').join('');
}

function auditStats() {
  let cited = 0;
  let twoPlus = 0;
  const used = new Set();
  for (const t of state.trophies) {
    for (const c of t.claims || []) {
      cited += 1;
      if (new Set(c.sources).size >= 2) twoPlus += 1;
      for (const s of c.sources) used.add(s);
    }
  }
  const outlets = Object.keys(state.sites).filter((code) => code !== 'OFF').length;
  const disputes = state.trophies.filter((t) => t.dispute).length;
  const unconfirmed = state.trophies.filter((t) => t.method === 'unconfirmed').length;
  return { cited, twoPlus, sites: outlets, used: used.size, disputes, unconfirmed };
}

function renderAudit() {
  const a = auditStats();
  $('auditCited').textContent = a.cited + '/' + a.cited;
  $('auditTwo').textContent = a.twoPlus;
  $('auditSites').textContent = a.sites;
  $('auditDisputes').textContent = a.disputes;
  $('auditUnconfirmed').textContent = a.unconfirmed;
}

function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  $('progressPct').textContent = pct + '%';
  $('progressCount').textContent = earned + ' / ' + total + ' earned';
  $('progressBar').style.width = pct + '%';
  const parts = GRADE_ORDER.map((g) => {
    const inGrade = state.trophies.filter((t) => t.grade === g);
    const got = inGrade.filter((t) => state.earned.has(t.id)).length;
    const label = g === 'platinum' ? 'Platinum' : g[0].toUpperCase() + g.slice(1);
    return '<b>' + got + '/' + inGrade.length + '</b> ' + label;
  });
  $('gradeCounts').innerHTML = parts.join(' · ');
}

function renderRoadmapStrip() {
  const strip = $('roadmapStrip');
  strip.innerHTML = '';
  state.stages.forEach((stage) => {
    const got = stage.trophies.filter((id) => state.earned.has(id)).length;
    const li = document.createElement('li');
    li.innerHTML = '<b>' + stage.n + '</b> ' + escapeHtml(stage.title) +
      ' <span class="n">' + got + '/' + stage.trophies.length + '</span>';
    li.addEventListener('click', () => showView('roadmap'));
    strip.appendChild(li);
  });
}

function filteredTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && t.missable !== 'possible') return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.onlyMissable && t.missable !== 'possible') return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderFilters() {
  const box = $('filters');
  box.innerHTML = '';
  const counts = { all: state.trophies.length };
  for (const t of state.trophies) counts[t.kind] = (counts[t.kind] || 0) + 1;
  counts.missable = state.trophies.filter((t) => t.missable === 'possible').length;
  for (const kind of ['all', 'story', 'missable', 'collectible', 'activity', 'misc']) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (state.kind === kind ? ' active' : '');
    btn.textContent = KIND_LABELS[kind] + ' ' + (counts[kind] || 0);
    btn.addEventListener('click', () => {
      state.kind = kind;
      renderFilters();
      renderList();
    });
    box.appendChild(btn);
  }
}

function countProgress(t) {
  if (!t.count) return null;
  const cur = state.counts[t.id] || 0;
  return { cur, target: t.count.target, label: t.count.label };
}

function renderList() {
  const list = $('list');
  const items = filteredTrophies();
  list.innerHTML = '';
  $('resultCount').textContent = items.length + ' of ' + state.trophies.length + ' trophies shown' +
    (state.earned.size ? ' · ' + state.earned.size + ' earned' : '');
  for (const t of items) {
    const hidden = spoilerHides(t);
    const li = document.createElement('li');
    li.className = 'trophy-row' + (state.earned.has(t.id) ? ' earned' : '') +
      (state.selectedId === t.id ? ' selected' : '');
    const nameHtml = hidden
      ? '<span class="hidden-name">??? — story trophy hidden</span>'
      : escapeHtml(t.name);
    const descHtml = hidden ? 'Hidden until earned — spoiler setting is on.' : escapeHtml(t.description);
    const cp = countProgress(t);
    li.innerHTML =
      '<input type="checkbox" ' + (state.earned.has(t.id) ? 'checked' : '') +
      ' aria-label="Mark ' + escapeHtml(t.name) + ' earned">' +
      '<span class="grade-chip grade-' + t.grade + '">' + t.grade + '</span>' +
      '<span class="row-main"><span class="row-name">' + nameHtml + '</span><br>' +
      '<span class="row-desc">' + descHtml + '</span></span>' +
      '<span class="row-tags">' +
      (t.missable === 'possible' ? '<span class="tag missable">Maybe missable</span>' : '') +
      (t.method === 'unconfirmed' ? '<span class="tag unconfirmed">Method unconfirmed</span>' : '') +
      (cp ? '<span class="tag count">' + cp.cur + '/' + cp.target + ' ' + escapeHtml(cp.label) + '</span>' : '') +
      (state.earned.has(t.id) ? '<span class="tag earned-tag">Earned</span>' : '') +
      '</span>';
    li.querySelector('input').addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleEarned(t.id);
    });
    li.addEventListener('click', () => {
      state.selectedId = t.id;
      renderList();
      renderDetail();
    });
    list.appendChild(li);
  }
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'detail-empty';
    li.textContent = 'No trophies match these filters.';
    list.appendChild(li);
  }
}

function renderDetail() {
  const box = $('detail');
  const t = findTrophy(state.selectedId) || state.trophies[0];
  if (!t) {
    box.innerHTML = '<p class="detail-empty">Loading trophies…</p>';
    return;
  }
  const hidden = spoilerHides(t);
  const earned = state.earned.has(t.id);
  const badge = t.method === 'unconfirmed'
    ? '<span class="badge-unconfirmed">Method unconfirmed — see dispute</span>'
    : '<span class="badge-official">Method confirmed by cited guides</span>';
  const warn = t.missable === 'possible'
    ? '<div class="warn-box"><b>Possibly missable.</b> The Chapter 1 meditation at Jason’s house is gone for good after Chapter 1. Do it on your first playthrough — see the dispute panel for what the guides disagree on.</div>'
    : '';
  const cp = countProgress(t);
  const countBox = cp
    ? '<div class="count-box"><label>Your progress: <input id="countInput" type="number" min="0" max="' + cp.target + '" value="' + cp.cur + '"> / ' + cp.target + ' ' + escapeHtml(cp.label) + '</label><span>Saved in this browser.</span></div>'
    : '';
  const stepsHtml = (t.steps || []).map((s) =>
    '<li>' + escapeHtml(s.text) + ' ' + sourceChips(s.sources) +
    ' <span class="claim-refs">claims ' + s.claims.join(', ') + '</span></li>').join('');
  const claimsHtml = (t.claims || []).map((c) =>
    '<li><b>' + c.n + '.</b> ' + escapeHtml(c.text) + ' ' + sourceChips(c.sources) + '</li>').join('');
  const sourcesHtml = (t.sources || []).map((s) => {
    const url = siteUrl(s.code);
    const name = escapeHtml(siteName(s.code));
    const link = url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(url) + '</a>' : 'official list';
    return '<li><b>' + name + '</b> — ' + s.claims + ' claim' + (s.claims === 1 ? '' : 's') +
      ' · read ' + escapeHtml(state.readDate) + ' · ' + link + '</li>';
  }).join('');
  const disputeHtml = t.dispute
    ? '<div class="dispute"><h4>Dispute — both versions</h4>' +
      '<p><b>Version A:</b> ' + escapeHtml(t.dispute.a) + '</p>' +
      '<p><b>Version B:</b> ' + escapeHtml(t.dispute.b) + '</p>' +
      '<p><b>Our call:</b> ' + escapeHtml(t.dispute.call) + '</p></div>'
    : '';
  box.innerHTML =
    '<div class="detail-grade"><span class="grade-chip grade-' + t.grade + '">' + t.grade + '</span> ' + badge + '</div>' +
    '<h2>' + (hidden ? '??? — story trophy hidden' : escapeHtml(t.name)) + '</h2>' +
    '<p class="official">' + (hidden ? 'Hidden until earned — spoiler setting is on.' : escapeHtml(t.description)) + '</p>' +
    (hidden
      ? '<h3>Guide</h3><p class="guide-text">Mark this trophy earned to reveal its guide — story spoilers stay hidden until then.</p>'
      : '<h3>Guide</h3><p class="guide-text">' + escapeHtml(t.guide) + '</p>' +
        '<h3>Steps</h3><ol class="steps">' + stepsHtml + '</ol>' +
        '<h3>Claims — numbered &amp; cited</h3><ol class="claims">' + claimsHtml + '</ol>' +
        '<h3>Sources for this trophy</h3><ul class="source-list">' + sourcesHtml + '</ul>' +
        disputeHtml) +
    warn + countBox +
    '<button class="mark-btn' + (earned ? ' earned' : '') + '" type="button">' +
    (earned ? '✓ Earned — click to unmark' : 'Mark as earned') + '</button>';
  box.querySelector('.mark-btn').addEventListener('click', () => toggleEarned(t.id));
  const input = box.querySelector('#countInput');
  if (input) {
    input.addEventListener('change', () => {
      const v = Math.max(0, Math.min(cp.target, Number(input.value) || 0));
      state.counts[t.id] = v;
      saveCounts();
      renderList();
    });
  }
}

function renderRoadmap() {
  const box = $('roadmapList');
  box.innerHTML = '';
  for (const stage of state.stages) {
    const got = stage.trophies.filter((id) => state.earned.has(id)).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const chips = stage.trophies.map((id) => {
      const t = findTrophy(id);
      if (!t) return '';
      const done = state.earned.has(id);
      return '<span class="stage-trophy' + (done ? ' done' : '') + '">' +
        '<span class="g ' + t.grade + '">●</span>' + escapeHtml(t.name) + '</span>';
    }).join('');
    li.innerHTML =
      '<div class="stage-head"><span class="stage-num">' + stage.n + '</span>' +
      '<h3>' + escapeHtml(stage.title) + '</h3>' +
      '<span class="count">' + got + '/' + stage.trophies.length + ' earned</span></div>' +
      '<p>' + escapeHtml(stage.summary) + '</p>' +
      '<p class="prereq">Needs: ' + escapeHtml(stage.prerequisite) + '</p>' +
      (stage.warning ? '<div class="warn-box"><b>Before the point of no return.</b> ' + escapeHtml(stage.warning) + '</div>' : '') +
      '<div class="stage-trophies">' + chips + '</div>';
    box.appendChild(li);
  }
}

function renderSources() {
  const totals = {};
  for (const t of state.trophies) {
    for (const c of t.claims || []) {
      for (const s of new Set(c.sources)) totals[s] = (totals[s] || 0) + 1;
    }
  }
  const rows = Object.keys(state.sites).sort().map((code) => {
    const s = state.sites[code];
    const url = s.url
      ? '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.url) + '</a>'
      : '—';
    const cited = totals[code] || 0;
    const note = cited === 0 ? 'read for list cross-check' : '';
    return '<tr><td>' + escapeHtml(s.site) + '</td><td>' + url + '</td><td>' + escapeHtml(state.readDate) + '</td><td>' + cited + ' ' + note + '</td></tr>';
  }).join('');
  $('sourcesTable').innerHTML = rows;
  const items = state.trophies.filter((t) => t.dispute).map((t) =>
    '<li><b>' + escapeHtml(t.name) + ':</b> ' + escapeHtml(t.dispute.call) + '</li>').join('');
  $('disputeList').innerHTML = items;
}

function renderAll() {
  renderAudit();
  renderProgress();
  renderRoadmapStrip();
  renderFilters();
  renderList();
  renderDetail();
  renderRoadmap();
  renderSources();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveEarned();
  renderAll();
}

function showView(view) {
  state.view = view;
  $('trackerView').hidden = view !== 'tracker';
  $('roadmapView').hidden = view !== 'roadmap';
  $('sourcesView').hidden = view !== 'sources';
  $('tabTracker').classList.toggle('active', view === 'tracker');
  $('tabRoadmap').classList.toggle('active', view === 'roadmap');
  $('tabSources').classList.toggle('active', view === 'sources');
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Platinum v3',
    earned: [...state.earned].sort((a, b) => a - b),
    counts: state.counts,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set(ids.filter((id) => valid.has(id)));
      if (data.counts && typeof data.counts === 'object') {
        state.counts = {};
        for (const [k, v] of Object.entries(data.counts)) {
          const id = Number(k);
          if (valid.has(id) && Number.isFinite(v)) state.counts[id] = Math.max(0, v);
        }
        saveCounts();
      }
      saveEarned();
      renderAll();
    } catch {
      alert('That file is not a Leonida Platinum export.');
    }
  };
  reader.readAsText(file);
}

async function init() {
  loadState();
  const [trophyData, roadmapData] = await Promise.all([
    fetch(TROPHIES_URL).then((r) => r.json()),
    fetch(ROADMAP_URL).then((r) => r.json()),
  ]);
  state.trophies = trophyData.trophies;
  state.sites = trophyData.sites;
  state.readDate = trophyData.readDate;
  state.stages = roadmapData.stages;
  $('search').addEventListener('input', (ev) => {
    state.query = ev.target.value;
    renderList();
  });
  $('onlyMissable').addEventListener('change', (ev) => {
    state.onlyMissable = ev.target.checked;
    renderList();
  });
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle').addEventListener('change', (ev) => {
    state.spoiler = ev.target.checked;
    saveSpoiler();
    renderAll();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (ev) => {
    if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
    ev.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and count progress?')) {
      state.earned = new Set();
      state.counts = {};
      saveEarned();
      saveCounts();
      renderAll();
    }
  });
  $('tabTracker').addEventListener('click', () => showView('tracker'));
  $('tabRoadmap').addEventListener('click', () => showView('roadmap'));
  $('tabSources').addEventListener('click', () => showView('sources'));
  renderAll();
}

init();
