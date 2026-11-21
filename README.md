# LEONIDA PLATINUM — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/rooneynft/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/rooneynft/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5: all 55 official trophies with a guide to each in the entrant's own words, where **every claim is numbered and cited** to a guide page read on 21 Nov 2026. A roadmap to the platinum with the missable trophy flagged, dispute panels wherever the guides disagree, and a checklist that saves your progress in the browser.

## What it does

- **55 trophies, all official.** Names, descriptions and grades exactly as PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden).
- **410 numbered claims, all cited.** Each trophy carries numbered claims, each with its sources; 187 claims are backed by 2+ sources. Steps cite the claims they rest on.
- **19 guide sites read** (21 Nov 2026): PowerPyx, KeenGamer, GTABase, Push Square, GameMapa, Sixshore, Mobalytics, Games.gg, Insider Gaming, EGamers, TechNerdiness, BoostingFactory, Radio Times, GamesFuze, GTAScoop, Vice Atlas, Techtroduce, Leonida Hub, GuideDistrict — plus the official trophy list. Every source is listed per trophy with its URL, read date and claim count.
- **10 dispute panels.** Where guides disagree, the trophy shows both versions and "our call" — e.g. platinum time (200h vs 300h+), the one missable trophy, the five still-unsolved hidden trophies, and three trophies older lists called unconfirmed that PowerPyx has now solved (Catch Me If You Can, Challenging Tank, Personal Best).
- **5 methods still unconfirmed** (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). Those guides show the official description and the best lead only — no invented steps.
- **Roadmap to the platinum** in 5 stages, in order, with prerequisites and warnings before each point of no return.
- **Missable flags.** One trophy is flagged possibly missable (Positive Mental Attitude — the Chapter 1 meditation), following PowerPyx, GTABase and KeenGamer; Push Square lists none known, and the dispute panel says so. A "Hanya missable" filter shows it.
- **Tracker**: checklist saved in localStorage, export to a file and import back, per-trophy count trackers (e.g. 120/250 stunts) saved in the browser, filters by kind (story, missable, collectibles, activities, misc), a spoiler setting that hides story trophies until earned, and search.
- **Fully offline**: static files, no build step, no network requests, no external assets. Serve `app/` with any static server and open `index.html`.

## Citation statistics

| Measure | Count |
|---|---|
| Trophies | 55 |
| Numbered claims, all cited | 410 / 410 |
| Claims backed by 2+ sources | 187 |
| Guide sites read (21 Nov 2026) | 19 |
| Dispute panels (both versions + our call) | 10 |
| Methods still unconfirmed | 5 |
| Possibly missable trophies | 1 |

## Method

Game released 19 Nov 2026; the full list went public 18 Nov 2026. Names, descriptions and grades are the official PlayStation list, reproduced identically across the guides read. Method details come from the guide pages above — PowerPyx first, cross-checked against KeenGamer, GTABase, Push Square, GameMapa and the rest. A second-opinion LLM (CoArena gpt-6-luna) drafted step outlines from the verified facts and cross-checked 12 risky claims against their source wording; 9 were supported, 3 were weak and were fixed (Push Square's "300 hours or more", the Chapter 4/Chapter 5 final-mission wording, and the hidden count: most guides say 28, Push Square marks 27). Every claim was verified against a page read by the builder; no guide text is copied — all guides are written in the builder's own words.

Two judgement calls worth knowing: (1) the missable flag follows the PowerPyx/GTABase/KeenGamer consensus of exactly 1 possibly missable trophy, not the older precautionary lists that flagged 18 mission-tied trophies — PowerPyx confirms all quest givers return after the story; (2) the hidden set (28) follows the 27-visible/28-hidden split reported by Sixshore, Insider Gaming and Leonida Hub — story trophies, contact finales and open-world secrets hidden, the rest visible.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080 (serve.ts in the kit)
```

or any static server pointed at `app/`. To hand it in, run `main.ts` (Node 22): it copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

## Verification

- Kit check: 4 passed, 0 failed (see commit message).
- Functional tests: 15/15 in headless Chromium — 55 rows render, localStorage persists across reload, export round-trip via reset+import, spoiler masks story trophies, filter counts correct, search works, zero external requests, dispute panel renders, count trackers persist.
- `main.ts` run twice: byte-identical output.
- No Rockstar logo or official artwork is used anywhere in this guide.

## Screenshots

1. `1-cover.jpg` — dashboard: audit strip, progress, filters, and the Hot Together guide with numbered steps, claims and sources.
2. `2-roadmap.jpg` — the full 5-stage roadmap to the platinum.
3. `3-spoiler.jpg` — spoiler setting on: earned story trophies shown, unearned hidden as "???".
4. `4-missable.jpg` — "Hanya missable" filter: the one possibly missable trophy.
