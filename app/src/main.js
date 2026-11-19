// Neon Coast v2 editor wiring: photo tray, presets, layout + grade pickers,
// title styles, per-panel crop sliders + fit toggle, click-to-select on the
// preview canvas, undo/redo history, live preview and PNG export in three
// post sizes. A `?shot=` query sets up a fixed scene (./shots.js).
import { renderCover, freshCrops, SIZES, LAYOUTS, PRESETS, GRADES, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const sizeLabel = document.getElementById('sizeLabel');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

const state = {
  photos: [],
  perPanel: {},          // panel index -> photos[] index (unset = cycle through all)
  crops: freshCrops(),  // one crop per panel
  layout: 'grid',
  grade: 'sunset',
  gradeStrength: 65,
  title: 'SUNSET HEIST',
  subtitle: 'one last ride down Ocean Drive',
  badge: 'VICE CITY • 2026',
  stars: 4,
  titleStyle: 'block',
  grain: 40,
  frame: false,
};
let selectedPanel = 0;
let previewSize = 'square';

// ---- Undo / redo history (snapshots of the serialisable state only) ----
const past = [];
const future = [];
let pendingPre = null;

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, gradeStrength: state.gradeStrength,
    title: state.title, subtitle: state.subtitle, badge: state.badge, stars: state.stars,
    titleStyle: state.titleStyle, grain: state.grain, frame: state.frame,
    crops: state.crops, perPanel: state.perPanel,
  });
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  if (!LAYOUTS[state.layout]) state.layout = 'grid';
  if (!GRADES[state.grade]) state.grade = 'sunset';
  if (!panelIndices().includes(selectedPanel)) selectedPanel = panelIndices()[0];
}

function syncUndoButtons() {
  undoBtn.disabled = past.length === 0;
  redoBtn.disabled = future.length === 0;
}

/** Run a discrete change with its pre-state pushed onto the undo stack. */
function commit(fn) {
  past.push(snapshot());
  if (past.length > 50) past.shift();
  future.length = 0;
  fn();
  syncAll(); redraw();
  syncUndoButtons();
}

/** For live inputs (text, sliders): capture the pre-state on first touch,
 *  bank it when the edit commits (change event). */
function beginEdit() { if (!pendingPre) pendingPre = snapshot(); }
function endEdit() {
  if (!pendingPre) return;
  past.push(pendingPre);
  if (past.length > 50) past.shift();
  future.length = 0;
  pendingPre = null;
  syncUndoButtons();
}

undoBtn.addEventListener('click', () => {
  if (!past.length) return;
  future.push(snapshot());
  applySnapshot(past.pop());
  syncAll(); redraw(); syncUndoButtons();
  statusEl.textContent = 'Undid that change.';
});
redoBtn.addEventListener('click', () => {
  if (!future.length) return;
  past.push(snapshot());
  applySnapshot(future.pop());
  syncAll(); redraw(); syncUndoButtons();
  statusEl.textContent = 'Redid that change.';
});

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  renderCover(canvas, previewSize, state);
  sizeLabel.textContent = SIZES[previewSize].label;
}

/** Panel indices the current layout actually shows (grid skips the centre). */
function panelIndices() {
  if (state.layout === 'grid') return [0, 1, 2, 3, 5, 6, 7, 8];
  return layoutPanels(previewSize, state.layout).map((r) => r.index);
}

function refreshTray() {
  const tray = document.getElementById('photoTray');
  tray.innerHTML = '';
  if (!state.photos.length) {
    tray.innerHTML = '<span class="empty">No photos yet — the two samples load automatically.</span>';
    return;
  }
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src; thumb.alt = `Photo ${i + 1}`;
    thumb.title = `Click to put photo ${i + 1} in panel ${selectedPanel + 1}`;
    if (state.perPanel[selectedPanel] === i) thumb.classList.add('selected');
    thumb.addEventListener('click', () => {
      commit(() => { state.perPanel[selectedPanel] = i; });
      refreshTray();
      statusEl.textContent = `Panel ${selectedPanel + 1} now shows photo ${i + 1}.`;
    });
    tray.appendChild(thumb);
  });
}

function buildPanelMap() {
  const map = document.getElementById('panelMap');
  map.innerHTML = '';
  if (state.layout === 'grid') {
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      if (i === 4) {
        b.textContent = 'TITLE'; b.classList.add('title-cell'); b.disabled = true;
        b.setAttribute('aria-label', 'Title block (centre)');
      } else {
        b.textContent = `P${i + 1}`;
        if (i === selectedPanel) b.classList.add('active');
        b.setAttribute('aria-label', `Select panel ${i + 1}`);
        b.addEventListener('click', () => selectPanel(i));
      }
      map.appendChild(b);
    }
    return;
  }
  for (const i of panelIndices()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `P${i + 1}`;
    if (i === selectedPanel) b.classList.add('active');
    b.setAttribute('aria-label', `Select panel ${i + 1}`);
    b.addEventListener('click', () => selectPanel(i));
    map.appendChild(b);
  }
}

function selectPanel(i) {
  selectedPanel = i;
  syncCropSliders();
  buildPanelMap(); refreshTray();
}

function syncCropSliders() {
  const crop = state.crops[selectedPanel];
  document.getElementById('zoom').value = Math.round(crop.zoom * 100);
  document.getElementById('panX').value = Math.round(crop.ox * 100);
  document.getElementById('panY').value = Math.round(crop.oy * 100);
  document.getElementById('zoomVal').textContent = `${crop.zoom.toFixed(2)}×`;
  document.getElementById('panXVal').textContent = String(Math.round(crop.ox * 100));
  document.getElementById('panYVal').textContent = String(Math.round(crop.oy * 100));
  document.getElementById('fitToggle').textContent = `Fit: ${crop.fit || 'cover'}`;
}

/** Sync every control with the state (used after undo/redo and presets). */
function syncAll() {
  document.querySelectorAll('#layoutSeg .seg-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeRow .grade').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#titleStyleSeg .seg-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.tstyle === state.titleStyle));
  document.getElementById('gradeStrength').value = state.gradeStrength;
  document.getElementById('gradeStrengthVal').textContent = `${state.gradeStrength}%`;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('stars').value = state.stars;
  document.getElementById('starsVal').textContent = '★'.repeat(state.stars) + '☆'.repeat(5 - state.stars);
  document.getElementById('grain').value = state.grain;
  document.getElementById('grainVal').textContent = `${state.grain}%`;
  document.getElementById('frameToggle').checked = state.frame;
  syncCropSliders();
  buildPanelMap(); refreshTray();
}

function bindCrop(id, apply) {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', beginEdit);
  el.addEventListener('focus', beginEdit);
  el.addEventListener('input', (e) => { apply(Number(e.target.value)); syncCropSliders(); redraw(); });
  el.addEventListener('change', endEdit);
}
bindCrop('zoom', (v) => { state.crops[selectedPanel].zoom = v / 100; });
bindCrop('panX', (v) => { state.crops[selectedPanel].ox = v / 100; });
bindCrop('panY', (v) => { state.crops[selectedPanel].oy = v / 100; });

function bindText(id, apply) {
  const el = document.getElementById(id);
  el.addEventListener('focus', beginEdit);
  el.addEventListener('input', (e) => { apply(e.target.value); redraw(); });
  el.addEventListener('change', endEdit);
}
bindText('title', (v) => { state.title = v.toUpperCase(); });
bindText('subtitle', (v) => { state.subtitle = v; });
bindText('badge', (v) => { state.badge = v; });

document.getElementById('fitToggle').addEventListener('click', () => {
  commit(() => {
    const crop = state.crops[selectedPanel];
    crop.fit = crop.fit === 'fit' ? 'cover' : 'fit';
  });
  statusEl.textContent = `Panel ${selectedPanel + 1} fit: ${state.crops[selectedPanel].fit}.`;
});
document.getElementById('resetPanel').addEventListener('click', () => {
  commit(() => { state.crops[selectedPanel] = { zoom: 1.3, ox: 0, oy: 0, fit: 'cover' }; });
  statusEl.textContent = `Panel ${selectedPanel + 1} crop reset.`;
});
document.getElementById('resetAll').addEventListener('click', () => {
  commit(() => { state.crops = freshCrops(); state.perPanel = {}; });
  statusEl.textContent = 'Crops reset.';
});

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    try { state.photos.push(await loadImage(URL.createObjectURL(file))); }
    catch { /* skip unreadable files */ }
  }
  e.target.value = '';
  refreshTray(); redraw();
  statusEl.textContent = `${state.photos.length} photo(s) loaded. Click a tray photo to place it in the selected panel.`;
});

document.getElementById('fillAll').addEventListener('click', () => {
  if (!state.photos.length) return;
  commit(() => { state.perPanel = {}; });
  statusEl.textContent = 'All panels cycle through your photos.';
});
document.getElementById('shuffle').addEventListener('click', () => {
  if (!state.photos.length) return;
  commit(() => {
    const order = state.photos.map((_, i) => i).sort(() => Math.random() - 0.5);
    for (let p = 0; p < 9; p++) state.perPanel[p] = order[p % order.length];
  });
  statusEl.textContent = 'Panels shuffled.';
});
document.getElementById('surprise').addEventListener('click', () => {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  commit(() => {
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.stars = 3 + Math.floor(Math.random() * 3);
  });
  statusEl.textContent = `Surprise: ${LAYOUTS[state.layout].label} + ${state.grade}.`;
});

document.querySelectorAll('#presetRow .preset').forEach((b) => {
  b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.preset];
    if (!p) return;
    commit(() => {
      state.layout = p.layout; state.grade = p.grade;
      state.title = p.title; state.subtitle = p.subtitle;
      state.badge = p.badge; state.stars = p.stars;
    });
    document.querySelectorAll('#presetRow .preset').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    statusEl.textContent = `Preset applied: ${b.textContent.trim()}.`;
  });
});

document.querySelectorAll('#layoutSeg .seg-btn').forEach((b) => {
  b.addEventListener('click', () => {
    commit(() => { state.layout = b.dataset.layout; });
  });
});
document.querySelectorAll('#gradeRow .grade').forEach((b) => {
  b.addEventListener('click', () => {
    commit(() => { state.grade = b.dataset.grade; });
  });
});
document.querySelectorAll('#titleStyleSeg .seg-btn').forEach((b) => {
  b.addEventListener('click', () => {
    commit(() => { state.titleStyle = b.dataset.tstyle; });
  });
});

const gradeStrengthEl = document.getElementById('gradeStrength');
gradeStrengthEl.addEventListener('pointerdown', beginEdit);
gradeStrengthEl.addEventListener('focus', beginEdit);
gradeStrengthEl.addEventListener('input', (e) => {
  state.gradeStrength = Number(e.target.value);
  document.getElementById('gradeStrengthVal').textContent = `${state.gradeStrength}%`;
  redraw();
});
gradeStrengthEl.addEventListener('change', endEdit);

const grainEl = document.getElementById('grain');
grainEl.addEventListener('pointerdown', beginEdit);
grainEl.addEventListener('focus', beginEdit);
grainEl.addEventListener('input', (e) => {
  state.grain = Number(e.target.value);
  document.getElementById('grainVal').textContent = `${state.grain}%`;
  redraw();
});
grainEl.addEventListener('change', endEdit);

document.getElementById('stars').addEventListener('input', (e) => {
  state.stars = Number(e.target.value);
  document.getElementById('starsVal').textContent = '★'.repeat(state.stars) + '☆'.repeat(5 - state.stars);
  redraw();
});
document.getElementById('stars').addEventListener('pointerdown', beginEdit);
document.getElementById('stars').addEventListener('focus', beginEdit);
document.getElementById('stars').addEventListener('change', endEdit);

document.getElementById('frameToggle').addEventListener('change', (e) => {
  commit(() => { state.frame = e.target.checked; });
  statusEl.textContent = state.frame ? 'White poster frame on.' : 'White poster frame off.';
});

document.querySelectorAll('.pv').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.pv').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    previewSize = b.dataset.preview;
    buildPanelMap();
    redraw();
  });
});

// Click a photo panel right on the preview to select it for cropping.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const hit = layoutPanels(previewSize, state.layout)
    .find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
  if (hit) {
    selectPanel(hit.index);
    statusEl.textContent = `Panel ${hit.index + 1} selected — use Zoom / Pan to frame it.`;
  }
});

// Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo.
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.target.matches('input[type="text"]')) return;
  if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undoBtn.click(); }
  else if ((e.key.toLowerCase() === 'y') || (e.key.toLowerCase() === 'z' && e.shiftKey)) { e.preventDefault(); redoBtn.click(); }
});

function exportCover(sizeKey) {
  const off = document.createElement('canvas');
  const size = renderCover(off, sizeKey, state);
  off.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  }, 'image/png');
}
document.querySelectorAll('.btn-export').forEach((b) => {
  b.addEventListener('click', () => exportCover(b.dataset.size));
});
document.getElementById('exportAll').addEventListener('click', () => {
  ['square', 'portrait', 'wide'].forEach((k, i) => setTimeout(() => exportCover(k), i * 250));
  statusEl.textContent = 'Exporting all three sizes…';
});

async function loadSamples() {
  for (const name of ['pier', 'boulevard']) {
    try { state.photos.push(await loadImage(`samples/${name}.jpg`)); } catch { /* sample missing */ }
  }
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, { loadImage, loadSamples, redraw, refreshTray, buildPanelMap, syncCropSliders, syncAll });
} else {
  buildPanelMap(); syncCropSliders();
  await loadSamples();
  refreshTray(); redraw();
}
