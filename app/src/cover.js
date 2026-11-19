// Neon Coast cover renderer — draws the whole poster on a 2D canvas.
// Layouts: "grid" (nine-panel grid with a halftone title block in the centre),
// "hero" (one big hero photo + three stacked panels + title band),
// "tilted" (tilted snapshot cards over a painted sunset sky).
// Grades are gradient maps laid over each photo plus a sky wash. All art is
// drawn here in code: no Rockstar logo, artwork or fonts anywhere.

export const GRADES = {
  sunset: { a: '#ff7a18', b: '#ff2e88', c: '#2b1055', sky: ['#ffd319', '#ff7a18', '#ff2e88', '#7b2ff7'] },
  neon: { a: '#00e5ff', b: '#ff2ec4', c: '#0b1035', sky: ['#00e5ff', '#7b2ff7', '#ff2ec4', '#120458'] },
  gold: { a: '#ffd319', b: '#ff2975', c: '#3a1c00', sky: ['#fff3a3', '#ffd319', '#ff7a18', '#8a2be2'] },
  palm: { a: '#2affd5', b: '#0b6e5d', c: '#04263b', sky: ['#b8fff1', '#2affd5', '#0e7490', '#04263b'] },
  heat: { a: '#ff3b30', b: '#ffb300', c: '#4a0000', sky: ['#ffe259', '#ff7a18', '#ff3b30', '#3d0000'] },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const PANEL_COUNT = 9;

/** Blank per-panel crop state: zoom 1..2.6, pan -0.5..0.5 of the panel. */
export function freshCrops() {
  return Array.from({ length: PANEL_COUNT }, () => ({ zoom: 1.3, ox: 0, oy: 0 }));
}

/** Draws one photo into a rect, cover-fit, with this panel's crop applied. */
export function drawPhotoInto(ctx, img, x, y, w, h, crop) {
  if (!img) { ctx.fillStyle = '#241a3d'; ctx.fillRect(x, y, w, h); return; }
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * (crop?.zoom ?? 1);
  const dw = iw * base, dh = ih * base;
  const dx = x + (w - dw) / 2 - (crop?.ox ?? 0) * w;
  const dy = y + (h - dh) / 2 - (crop?.oy ?? 0) * h;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Sunset/neon wash over a photo rect: gradient map + warm highlights. */
export function gradePhoto(ctx, x, y, w, h, grade, strength) {
  const s = strength / 100;
  if (s <= 0) return;
  const g = GRADES[grade];
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, g.a); grad.addColorStop(1, g.b);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = 0.28 * s; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.35 * s; ctx.fillStyle = g.a; ctx.fillRect(x, y, w, h * 0.45);
  ctx.globalAlpha = 0.30 * s; ctx.fillStyle = g.c; ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  ctx.restore();
}

/** Halftone dot field, denser toward the bottom — the title-block texture. */
export function halftone(ctx, x, y, w, h, color, maxR) {
  ctx.save(); ctx.fillStyle = color;
  const step = Math.max(10, w / 34);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const t = (row * step) / h; // 0 top -> 1 bottom
      const r = maxR * (0.25 + 0.75 * t) * (0.7 + 0.3 * Math.sin(col * 1.7 + row));
      if (r <= 0.4) continue;
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Five-star heat meter; filled stars are gold, empty ones are outlines. */
export function drawHeatMeter(ctx, cx, y, stars, size) {
  const gap = size * 1.25, total = gap * 5 - size * 0.25;
  let x = cx - total / 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, x + size / 2, y + size / 2, size / 2, i < stars);
    x += gap;
  }
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (filled) { ctx.fillStyle = '#ffd319'; ctx.fill(); ctx.strokeStyle = '#7a5200'; ctx.lineWidth = r * 0.12; ctx.stroke(); }
  else { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = r * 0.14; ctx.stroke(); }
  ctx.restore();
}

/** Diagonal badge ribbon across a corner. */
export function drawBadgeRibbon(ctx, W, text, grade) {
  const g = GRADES[grade];
  ctx.save();
  ctx.translate(W, 0);
  ctx.rotate(Math.PI / 4);
  const band = Math.max(34, W * 0.045);
  const grad = ctx.createLinearGradient(0, 0, 0, band);
  grad.addColorStop(0, g.a); grad.addColorStop(1, g.b);
  ctx.fillStyle = grad;
  ctx.fillRect(-W * 0.42, -band / 2 + W * 0.16, W * 0.84, band);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${Math.round(band * 0.52)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, W * 0.16 + 1, W * 0.8);
  ctx.restore();
}

/** Big block title with outline + drop shadow, fitted to the width. */
export function drawTitle(ctx, text, cx, y, maxW, px, color) {
  let size = px;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const font = (s) => `900 ${s}px "Arial Black", Arial, sans-serif`;
  ctx.font = font(size);
  while (size > 18 && ctx.measureText(text).width > maxW) { size -= 4; ctx.font = font(size); }
  ctx.save();
  ctx.translate(2, 3); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.font = font(size);
  ctx.fillText(text, cx, y, maxW);
  ctx.restore();
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = '#12081f'; ctx.strokeText(text, cx, y, maxW);
  ctx.fillStyle = color; ctx.fillText(text, cx, y, maxW);
  return size;
}

function drawSubtitle(ctx, text, cx, y, maxW, px) {
  ctx.save();
  ctx.font = `italic 700 ${px}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.fillText(text, cx, y, maxW);
  ctx.restore();
}

/** Film grain + vignette over the whole cover. */
export function finishCover(ctx, W, H, grade) {
  const g = GRADES[grade];
  ctx.save();
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.globalAlpha = Math.random() * 0.05;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,20,.38)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = g.a; ctx.lineWidth = Math.max(6, W * 0.008);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.restore();
}

function skyWash(ctx, W, H, grade) {
  const g = GRADES[grade];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  g.sky.forEach((c, i) => grad.addColorStop(i / (g.sky.length - 1), c));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.42, Math.min(W, H) * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,122,24,.35)';
  ctx.beginPath(); ctx.arc(W * 0.5, H * 0.42, Math.min(W, H) * 0.17, 0, Math.PI * 2); ctx.fill();
}

/** Simple palm silhouette drawn from arcs — original art, no photos needed. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -60, 4, -120); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.15) - (i * Math.PI) / 8.5;
    ctx.beginPath(); ctx.moveTo(4, -120);
    ctx.quadraticCurveTo(4 + Math.cos(a) * 55, -120 + Math.sin(a) * 42, 4 + Math.cos(a) * 95, -120 + Math.sin(a) * 78);
    ctx.stroke();
  }
  ctx.restore();
}

function panelPhoto(state, i) {
  const photos = state.photos || [];
  if (!photos.length) return null;
  if (state.perPanel && state.perPanel[i] != null) return photos[state.perPanel[i]] ?? null;
  return photos[i % photos.length];
}

function framePanel(ctx, x, y, w, h, grade) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = GRADES[grade].a; ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.strokeRect(x + ctx.lineWidth * 2, y + ctx.lineWidth * 2, w - ctx.lineWidth * 4, h - ctx.lineWidth * 4);
  ctx.restore();
}

function drawGridCover(ctx, W, H, state) {
  const gap = Math.round(W * 0.014);
  const cw = (W - gap * 4) / 3, ch = (H - gap * 4) / 3;
  const g = GRADES[state.grade];
  ctx.fillStyle = '#12081f'; ctx.fillRect(0, 0, W, H);
  let i = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = gap + c * (cw + gap), y = gap + r * (ch + gap);
      if (r === 1 && c === 1) {
        // Centre title block: halftone + title + subtitle + heat meter.
        const bg = ctx.createLinearGradient(x, y, x + cw, y + ch);
        bg.addColorStop(0, g.a); bg.addColorStop(1, g.b);
        ctx.fillStyle = bg; ctx.fillRect(x, y, cw, ch);
        halftone(ctx, x, y, cw, ch, 'rgba(0,0,0,.28)', Math.max(2, cw * 0.02));
        const ts = drawTitle(ctx, state.title || 'NEON COAST', x + cw / 2, y + ch * 0.42, cw * 0.92, cw * 0.16, '#ffffff');
        drawSubtitle(ctx, state.subtitle || '', x + cw / 2, y + ch * 0.42 + ts * 0.55, cw * 0.9, Math.max(12, cw * 0.055));
        drawHeatMeter(ctx, x + cw / 2, y + ch * 0.78, state.stars || 4, Math.max(12, cw * 0.075));
        framePanel(ctx, x, y, cw, ch, state.grade);
        i++;
        continue;
      }
      const img = panelPhoto(state, i);
      drawPhotoInto(ctx, img, x, y, cw, ch, state.crops[i]);
      gradePhoto(ctx, x, y, cw, ch, state.grade, state.gradeStrength);
      framePanel(ctx, x, y, cw, ch, state.grade);
      i++;
    }
  }
  if (state.badge) drawBadgeRibbon(ctx, W, state.badge, state.grade);
}

function drawHeroCover(ctx, W, H, state) {
  const gap = Math.round(W * 0.014);
  const bandH = Math.round(H * 0.24);
  const topH = H - bandH - gap * 2;
  const heroW = Math.round(W * 0.62);
  const sideW = W - heroW - gap * 3;
  const sideH = (topH - gap * 2) / 3;
  ctx.fillStyle = '#12081f'; ctx.fillRect(0, 0, W, H);
  const hero = panelPhoto(state, 0);
  drawPhotoInto(ctx, hero, gap, gap, heroW, topH, state.crops[0]);
  gradePhoto(ctx, gap, gap, heroW, topH, state.grade, state.gradeStrength);
  framePanel(ctx, gap, gap, heroW, topH, state.grade);
  for (let k = 0; k < 3; k++) {
    const x = gap * 2 + heroW, y = gap + k * (sideH + gap);
    const img = panelPhoto(state, k + 1);
    drawPhotoInto(ctx, img, x, y, sideW, sideH, state.crops[k + 1]);
    gradePhoto(ctx, x, y, sideW, sideH, state.grade, state.gradeStrength);
    framePanel(ctx, x, y, sideW, sideH, state.grade);
  }
  // Title band: halftone sky strip with the big title.
  const by = gap + topH + gap;
  const g = GRADES[state.grade];
  const bg = ctx.createLinearGradient(0, by, W, by + bandH);
  bg.addColorStop(0, g.a); bg.addColorStop(0.6, g.b); bg.addColorStop(1, g.c);
  ctx.fillStyle = bg; ctx.fillRect(gap, by, W - gap * 2, bandH);
  halftone(ctx, gap, by, W - gap * 2, bandH, 'rgba(0,0,0,.25)', Math.max(2, W * 0.012));
  drawTitle(ctx, state.title || 'NEON COAST', W / 2, by + bandH * 0.52, W * 0.86, bandH * 0.34, '#ffffff');
  drawSubtitle(ctx, state.subtitle || '', W / 2, by + bandH * 0.52 + bandH * 0.22, W * 0.8, Math.max(13, bandH * 0.13));
  drawHeatMeter(ctx, W / 2, by + bandH * 0.82, state.stars || 4, Math.max(12, bandH * 0.09));
  if (state.badge) drawBadgeRibbon(ctx, W, state.badge, state.grade);
}

function drawTiltedCover(ctx, W, H, state) {
  skyWash(ctx, W, H, state.grade);
  drawPalm(ctx, W * 0.06, H * 0.98, Math.min(W, H) * 0.0022, 'rgba(20,4,32,.9)');
  drawPalm(ctx, W * 0.94, H * 0.99, Math.min(W, H) * 0.0026, 'rgba(20,4,32,.9)');
  const cardW = W * 0.30, cardH = H * 0.52;
  const tilts = [-0.09, 0.05, -0.04];
  const spots = [
    { x: W * 0.07, y: H * 0.08 },
    { x: W * 0.36, y: H * 0.03 },
    { x: W * 0.65, y: H * 0.09 },
  ];
  for (let k = 0; k < 3; k++) {
    const img = panelPhoto(state, k);
    const { x, y } = spots[k];
    ctx.save();
    ctx.translate(x + cardW / 2, y + cardH / 2);
    ctx.rotate(tilts[k]);
    ctx.translate(-cardW / 2, -cardH / 2);
    ctx.fillStyle = '#fdf6ec';
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillRect(0, 0, cardW, cardH + cardH * 0.16);
    ctx.shadowColor = 'transparent';
    const pad = cardW * 0.05;
    drawPhotoInto(ctx, img, pad, pad, cardW - pad * 2, cardH - pad * 2, state.crops[k]);
    gradePhoto(ctx, pad, pad, cardW - pad * 2, cardH - pad * 2, state.grade, state.gradeStrength);
    ctx.fillStyle = '#241a3d';
    ctx.font = `italic 700 ${Math.max(13, cardW * 0.07)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(['golden hour', 'night drive', 'pier pressure'][k], cardW / 2, cardH + cardH * 0.09, cardW * 0.9);
    ctx.restore();
  }
  // Bottom title slab.
  const slabY = H * 0.71, slabH = H * 0.27;
  const g = GRADES[state.grade];
  const bg = ctx.createLinearGradient(0, slabY, 0, H);
  bg.addColorStop(0, 'rgba(18,8,31,.88)'); bg.addColorStop(1, 'rgba(18,8,31,.97)');
  ctx.fillStyle = bg; ctx.fillRect(0, slabY, W, slabH);
  ctx.fillStyle = g.a; ctx.fillRect(0, slabY, W, Math.max(4, H * 0.008));
  drawTitle(ctx, state.title || 'NEON COAST', W / 2, slabY + slabH * 0.48, W * 0.88, slabH * 0.36, '#ffffff');
  drawSubtitle(ctx, state.subtitle || '', W / 2, slabY + slabH * 0.48 + slabH * 0.22, W * 0.8, Math.max(13, slabH * 0.14));
  drawHeatMeter(ctx, W / 2, slabY + slabH * 0.84, state.stars || 4, Math.max(12, slabH * 0.1));
  if (state.badge) drawBadgeRibbon(ctx, W, state.badge, state.grade);
}

/** Renders the full cover for `state` onto `canvas` at one of the SIZES. */
export function renderCover(canvas, sizeKey, state) {
  const size = SIZES[sizeKey] || SIZES.square;
  canvas.width = size.w; canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const norm = {
    ...state,
    grade: GRADES[state.grade] ? state.grade : 'sunset',
    gradeStrength: state.gradeStrength ?? 65,
    stars: state.stars ?? 4,
    crops: state.crops || freshCrops(),
  };
  if (norm.layout === 'hero') drawHeroCover(ctx, size.w, size.h, norm);
  else if (norm.layout === 'tilted') drawTiltedCover(ctx, size.w, size.h, norm);
  else drawGridCover(ctx, size.w, size.h, norm);
  finishCover(ctx, size.w, size.h, norm.grade);
  return size;
}
