// Neon Coast v2 — a gta6-cover-art-01 entry (Node 22, standard library only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, no library, no network
// request). This program hands it in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): app/ at most 993 files and
// 48 MiB in all, app/index.html at most 1 MiB, screenshots/ 3-4 files of at
// most 256 KiB each, dossier.json at most 1.5 MiB. Refuse early, here, rather
// than handing the grader an entry the scorer would refuse.
function checkShots() {
  const dir = join(here, 'screenshots');
  if (!existsSync(dir)) throw new Error('screenshots/ is missing');
  const shots = readdirSync(dir).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`screenshots/ holds ${shots.length} files, need 3 or 4`);
  }
}

function handIn() {
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  writeFileSync(
    join(out, 'dossier.json'),
    buildDossier(out, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

checkShots();
handIn();
