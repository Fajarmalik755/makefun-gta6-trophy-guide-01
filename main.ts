// Vice City Platinum Playbook — entry hand-in program (Node 22, stdlib only).
//
// What it does, in plain terms: it gathers the guide (the app/ folder next to
// this file, plus screenshots/ when they exist) and hands them to the make.fun
// grader by writing them into the output directory and adding dossier.json,
// the summary the grader's own library builds from those files.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside the
// grader /output is used. Two runs must write byte-identical output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Folder this file lives in, and the folder we hand the entry into.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The two folders the entry is made of. app/ is required; screenshots/ is
// copied only when the maker has added renders of the guide.
const appSource = join(repoRoot, 'app');
const shotsSource = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(appSource, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });
}

// Dossier limits mirror the competition gate: the text budget, at most four
// screenshots of 256 KiB, and the app/ file and byte caps. These numbers come
// from the kit's gate reference, not from this entry's own files.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossierText = buildDossier(outputDir, dossierOptions);
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
console.log('Handed in: app/ + screenshots/ + dossier.json in ' + outputDir);
