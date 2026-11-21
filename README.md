# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Fajarmalik755/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Fajarmalik755/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Sunset Strip Trophy Guide — an offline web guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources, a roadmap to the platinum, missable flags, count steppers, a spoiler shield for the 28 hidden trophies, and progress saved in the browser with export and import. No network needed, no Rockstar artwork, system fonts only.

## What's inside

- `app/index.html`, `app/style.css`, `app/app.js` — the guide and tracker (Tracker, Roadmap, Missables and Sources tabs).
- `app/data/trophies.json` — all 55 official trophies with guides, sources, counts, missable flags and roadmap stages.
- `main.ts` — builds the submission dossier; `serve.ts` — serves the app locally.
- `screenshots/` — four renders of the app; `shots.json` lists them.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — the app is plain static files under `app/`, so any static server works too. `node main.ts` (with `MAKEFUN_OUTPUT_DIR` set outside the grader) builds the submission dossier into the output directory.

---

<sub>Entered on [make.fun](https://make.fun/?ref=crisp-harbor-96&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
