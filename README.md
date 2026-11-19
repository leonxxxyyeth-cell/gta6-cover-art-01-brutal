[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/leonxxxyyeth-cell/gta6-cover-art-01-brutal/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/leonxxxyyeth-cell/gta6-cover-art-01-brutal/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Coast v2 — Vice City Cover Studio

A make.fun bounty entry for **gta6-cover-art-01** ("Make GTA 6 Cover Art").
Bounty page: https://make.fun/bounty/gta6-cover-art-01

An **offline** web app that turns your photos + a caption into GTA 6-style
cover art: a multi-panel poster with bold lettering and a Vice City
sunset/neon grade, exported as a PNG to share. Photos never leave the
machine — everything runs in the browser from static files.

## What v2 adds over v1

- **Five layouts** (was three) — Nine-Panel Grid, Hero + Three, Tilted
  Snapshots, plus new **Film Strip** (tall frame + three small frames with
  sprocket holes) and **Full-Bleed Poster** (one photo under a gradient
  scrim, huge left-aligned title).
- **Seven grades** (was five) — Sunset, Neon Night, Vice Gold, Palm Teal,
  Heatwave, plus new **Midnight** and **Candy Pop**.
- **One-click presets** — Golden Getaway, Neon Night Drive, Vice Gold Rush,
  Midnight Run, Candy Cruise; and a 🎲 Surprise me randomiser.
- **Three title styles** — Block, Outline, Neon glow.
- **Undo / redo** — full history over layout, grade, lettering and crops
  (buttons + Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z).
- **Click a panel on the preview** to select it for cropping; the mini-map
  adapts to the layout (grid keeps its 3×3 map with the title block).
- **Per-panel fit** — cover or fit (whole photo over a blurred backdrop).
- **Finish controls** — white poster frame toggle + film grain slider.

## What it does

- **Any photo** — add one photo or several; click a panel in the mini-map
  or on the preview, then pick a photo for it — or fill/shuffle all panels.
  Per-panel zoom and pan sliders crop and position each shot.
- **Lettering** — editable title, subtitle and badge ribbon, plus a
  five-star heat meter.
- **Export PNG** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, one at a time
  or all three at once.
- **Fully offline** — no network requests, no external libraries, no
  uploads. Sample photos ship under `app/samples/` (made with an image
  model for make.fun, free to use).

Original art throughout: no Rockstar Games logo, artwork or fonts.

## Try it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-app.ts`.

## Screenshots

`scripts/shots.mjs` serves the app and captures the four scenes in
`shots.json` with headless Chromium (Playwright).

## License

MIT — see [LICENSE](LICENSE).
