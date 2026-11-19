// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover and ?shot=story show the exported cover alone,
// full-bleed, at the size the query asks for. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the title words, `layout` the panel layout
// (grid | hero | tilted), `grade` the colour grade, `size` the export size
// (square | portrait | wide). window.__shotReady is set once painted.
export async function runShot(shot, query, state, api) {
  state.layout = query.get('layout') ?? 'grid';
  state.grade = query.get('grade') ?? 'sunset';
  state.title = (query.get('caption') ?? 'Sunset Heist').toUpperCase();
  state.subtitle = query.get('subtitle') ?? 'one last ride down Ocean Drive';
  state.badge = query.get('badge') ?? 'VICE CITY • 2026';
  state.stars = Number(query.get('stars') ?? 4);
  const size = query.get('size') ?? (shot === 'story' ? 'portrait' : 'square');

  // Keep the layout/grade buttons in sync with the scene.
  document.querySelectorAll('#layoutSeg .seg-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeRow .grade').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.pv').forEach((b) =>
    b.classList.toggle('active', b.dataset.preview === size));
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;

  const photoName = query.get('photo') ?? 'pier';
  try {
    state.photos = [await api.loadImage(`samples/${photoName}.jpg`)];
    const other = photoName === 'pier' ? 'boulevard' : 'pier';
    state.photos.push(await api.loadImage(`samples/${other}.jpg`));
  } catch { /* sample missing: render the empty-panel poster */ }

  // A little per-panel framing so the shots show the crop controls' effect.
  state.crops[0] = { zoom: 1.45, ox: -0.06, oy: 0.04 };
  state.crops[2] = { zoom: 1.2, ox: 0.08, oy: -0.05 };

  api.buildPanelMap(); api.syncCropSliders(); api.refreshTray();
  if (shot === 'cover' || shot === 'story') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    const { renderCover } = await import('./cover.js');
    renderCover(canvas, size, state);
  } else {
    api.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
