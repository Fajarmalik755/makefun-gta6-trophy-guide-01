# Vice City Platinum Playbook

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Fajarmalik755/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Fajarmalik755/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — an entry for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

Every trophy is listed with its official name, description and grade, plus a guide written in our own words that cites its source (what to do, where, and when it can be missed). The tracker saves progress in the browser with export and import, filters by kind and grade, and hides hidden and story trophy names behind a spoiler shield until they are earned. A three-stage roadmap leads to the platinum, and the single missable trophy — Positive Mental Attitude — is flagged throughout. Five trophies have no confirmed method yet and are marked UNCONFIRMED instead of guessed at.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` and works with the network off; it loads nothing from outside its own folder.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Facts

- 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden.
- Difficulty about 4/10, roughly 200 hours, one playthrough, zero online trophies.
- Only one trophy can be missed. Five trophies have no confirmed method yet and are marked UNCONFIRMED in the guide rather than guessed at.
- Sources: PowerPyx, PushSquare, PlanetGTA6 and KeenGamer — each trophy names its source beside its guide in the app.

## License

MIT — see [LICENSE](LICENSE).
