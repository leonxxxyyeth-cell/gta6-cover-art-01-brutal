# Neon Coast — Vice City Cover Studio

A make.fun bounty entry for **gta6-cover-art-01** ("Make GTA 6 Cover Art").

An **offline** web app that turns your photos + a caption into GTA 6-style
cover art: a multi-panel poster with bold lettering and a Vice City
sunset/neon grade, exported as a PNG to share. Photos never leave the
machine — everything runs in the browser from static files.

## What it does

- **Three layouts** — Nine-Panel Grid (halftone title block in the centre),
  Hero + Three (big hero photo, three stacked panels, title band), and
  Tilted Snapshots (polaroid-style cards over a painted sunset sky with
  palm silhouettes drawn in code).
- **Five grades** — Sunset, Neon Night, Vice Gold, Palm Teal, Heatwave, with
  a strength slider. Grades are gradient maps laid over each photo.
- **Any photo** — add one photo or several; click a panel in the mini-map
  and place a photo in it, or fill/shuffle all panels. Per-panel zoom and
  pan sliders crop and position each shot.
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
