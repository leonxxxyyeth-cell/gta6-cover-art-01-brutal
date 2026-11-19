// Neon Coast editor wiring: photo tray, layout + grade pickers, per-panel crop
// sliders, lettering fields, live preview and PNG export in three post sizes.
// A `?shot=` query sets up a fixed scene for screenshots (./shots.js).
import { renderCover, freshCrops, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const sizeLabel = document.getElementById('sizeLabel');

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
};
let selectedPanel = 0;
let previewSize = 'square';

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
      state.perPanel[selectedPanel] = i;
      refreshTray(); redraw();
      statusEl.textContent = `Panel ${selectedPanel + 1} now shows photo ${i + 1}.`;
    });
    tray.appendChild(thumb);
  });
}

function buildPanelMap() {
  const map = document.getElementById('panelMap');
  map.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = i === 4 ? 'TITLE' : `P${i + 1}`;
    if (i === 4) b.classList.add('title-cell');
    if (i === selectedPanel) b.classList.add('active');
    b.setAttribute('aria-label', i === 4 ? 'Title block (centre)' : `Select panel ${i + 1}`);
    b.addEventListener('click', () => {
      selectedPanel = i;
      syncCropSliders();
      buildPanelMap(); refreshTray();
    });
    map.appendChild(b);
  }
}

function syncCropSliders() {
  const crop = state.crops[selectedPanel];
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('panX');
  const panY = document.getElementById('panY');
  zoom.value = Math.round(crop.zoom * 100);
  panX.value = Math.round(crop.ox * 100);
  panY.value = Math.round(crop.oy * 100);
  document.getElementById('zoomVal').textContent = `${crop.zoom.toFixed(2)}×`;
  document.getElementById('panXVal').textContent = String(Math.round(crop.ox * 100));
  document.getElementById('panYVal').textContent = String(Math.round(crop.oy * 100));
}

function bindCrop(id, apply) {
  document.getElementById(id).addEventListener('input', (e) => {
    apply(Number(e.target.value));
    syncCropSliders(); redraw();
  });
}
bindCrop('zoom', (v) => { state.crops[selectedPanel].zoom = v / 100; });
bindCrop('panX', (v) => { state.crops[selectedPanel].ox = v / 100; });
bindCrop('panY', (v) => { state.crops[selectedPanel].oy = v / 100; });

document.getElementById('resetPanel').addEventListener('click', () => {
  state.crops[selectedPanel] = { zoom: 1.3, ox: 0, oy: 0 };
  syncCropSliders(); redraw();
});
document.getElementById('resetAll').addEventListener('click', () => {
  state.crops = freshCrops(); state.perPanel = {};
  syncCropSliders(); refreshTray(); redraw();
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
  state.perPanel = {};
  redraw();
  statusEl.textContent = 'All panels cycle through your photos.';
});
document.getElementById('shuffle').addEventListener('click', () => {
  if (!state.photos.length) return;
  const order = state.photos.map((_, i) => i).sort(() => Math.random() - 0.5);
  for (let p = 0; p < 9; p++) state.perPanel[p] = order[p % order.length];
  refreshTray(); redraw();
  statusEl.textContent = 'Panels shuffled.';
});

document.querySelectorAll('#layoutSeg .seg-btn').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#layoutSeg .seg-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.layout = b.dataset.layout;
    redraw();
  });
});
document.querySelectorAll('#gradeRow .grade').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#gradeRow .grade').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.grade = b.dataset.grade;
    redraw();
  });
});
document.getElementById('gradeStrength').addEventListener('input', (e) => {
  state.gradeStrength = Number(e.target.value);
  document.getElementById('gradeStrengthVal').textContent = `${state.gradeStrength}%`;
  redraw();
});
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value.toUpperCase(); redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
document.getElementById('stars').addEventListener('input', (e) => {
  state.stars = Number(e.target.value);
  document.getElementById('starsVal').textContent = '★'.repeat(state.stars) + '☆'.repeat(5 - state.stars);
  redraw();
});

document.querySelectorAll('.pv').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.pv').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    previewSize = b.dataset.preview;
    redraw();
  });
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
  runShot(shot, params, state, { loadImage, loadSamples, redraw, refreshTray, buildPanelMap, syncCropSliders });
} else {
  buildPanelMap(); syncCropSliders();
  await loadSamples();
  refreshTray(); redraw();
}
