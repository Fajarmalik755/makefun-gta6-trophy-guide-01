// Leonida Trophy Codex — entry program. Copies app/ and screenshots/ into the
// output directory and writes dossier.json with the kit's buildDossier helper.
// Run from the entry root: MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outputDir, { recursive: true });
cpSync(join(here, "app"), join(outputDir, "app"), { recursive: true });

const screenshotsDir = join(outputDir, "screenshots");
mkdirSync(screenshotsDir, { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), screenshotsDir, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

// buildDossier returns the dossier as raw bytes: write them out unchanged.
writeFileSync(join(outputDir, "dossier.json"), dossier);
