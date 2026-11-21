// Sunset Strip Trophy Guide — submission program (Node 22, standard library only).
//
// The entry is the static web app in app/ (index.html, its scripts, styles and
// data/trophies.json) plus 3 or 4 screenshots in screenshots/. This program
// hands it in: it copies both folders into the output directory and writes
// dossier.json there with the vendored make.fun library, exactly as the
// scorer rebuilds it. vendor/makefun-frontend.ts must stay byte-identical
// to the kit's copy, or the dossier will not match.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appSource = join(repoRoot, 'app');
const shotsSource = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(appSource, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate: at most 4 screenshots of 256 KiB, app/ at most
// 993 files and directories and 48 MiB, dossier text at most 160 KiB.
// buildDossier throws when a cap is breached, so a bad build fails loudly
// here instead of shipping a dossier the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
