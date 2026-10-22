---
title: "apex-buddy"
date: 2026-10-21
status: WIP
link: ""          # e.g. the repo URL
#image: cover.png
linkLabel: "repo"
weight: 1
summary: "Tools to analyse squads and suggest compositions, considering multiple dimensions"
draft: true
---

Here's the story in phases, with the decisions and numbers that would make good material for the post.

## 1. The starting point

The tool began as a way for your group of five to settle "what should we run?" before a match. It lives in its own repo (`rwnmk/apex-comp-analyser`), like your RP calculator, and is styled with your personal site's CSS so it feels like part of the same site. It's a static page on GitHub Pages with no build step.

The core idea was simple: tag every legend with traits (rotation, intel, engage, building lockdown, sustain, and so on), then score a three-legend comp on how well it covers them, plus a smaller bonus for rated pair synergies. All the opinions live in one JSON file that you edit yourself, and the page validates it and lists every problem with its location.

By the time of the first handover, the core loop was in place:
- a player library where each person marks every legend as comfort / can play / won't play;
- tuning by map, trait priorities and locked legends;
- a generator that checks all 3,276 possible comps and shows the top suggestions;
- a "show the worst comp" joke mode;
- a full breakdown of any comp: written summary, gaps, upgrades with auto-pick, coverage, pairs and map fit.

Squads and comps fit into short share links, with each player's picks packed into about 8 characters.

## 2. Reviewing it like a pull request

The next step was a senior-engineer-style code review before adding anything else. It found ten real issues:
- opening a friend's share link could silently overwrite your own saved picks with their stale copy;
- links didn't reproduce the sender's view, because missing settings fell back to yours;
- stale results showed the wrong player names after the roster changed;
- buttons crashed if pressed before the data loaded;
- smaller gaps in validation.

All ten were fixed and tested in a headless browser before any new features went in.

## 3. Features from playing with it

Real use drove the next round:
- **Comfort ranking:** results show their comfort bonus (`★★ +6`), so a lower score ranked higher stops looking like a bug.
- **Swaps:** each legend gets its best single-legend replacements, and browser Back undoes a swap. "Make it worse" mode does the opposite.
- **Pins:** a locked legend can be pinned to a player, for the friend who plays the same legend every game.
- **Breach:** asking why Crypto never appeared led to a new trait for bunker-busting kits like EMP, Maggie's drill and Fuse's ultimate.
- **ALGS markers:** badges for known pro comps, and for upgrades that are better in ranked or in ALGS.

## 4. A UI pass

- Legends are sorted by class on screen. Codes and links depend on the JSON order, so the sorting happens only at display time.
- Useless perks can be marked SKIP.
- The summary got one labelled line per part.
- A coverage radar chart fills the empty space beside the score.
- Full-synergy comps get a "full house" badge and all-negative ones get "civil war".
- Custom tooltips were deliberately declined: they don't work on phones, so nothing important should live only in a tooltip.

## 5. Cleanup and architecture

Old link formats were removed, and duplicated badge styles were merged into one. The 1,500-line script was split into eight ES modules, still with no build step. The scoring module never touches the page, so it can be unit-tested directly. That set up a separate track for writing Playwright tests in TypeScript.

The whole page is about 48 KB gzipped. Minifying would have saved about 9 KB, which wasn't worth giving up readable source.

## 6. Rethinking the model

After a session with the group, the honest verdict was that the model didn't value the *idea* of a comp. It rewarded legends that do a bit of everything. Each trait was capped at "covered", so going deep earned almost nothing, and raising a trait's priority barely moved the rankings. Octane + Axle + Conduit, a coherent "take space, over and over" comp, scored 44 against a top score of 82.

The fix came from talking about how the group actually thinks about comps:

- **Plans:** six comp styles, described on three axes: how the comp wins (kills or placement), what it does with cover (use it, break it, bypass it or avoid it), and where it plays (inside the ring or on the edge). They got animal names: Badger, Ram, Hawk, Spider, Wolf and Fox. A comp with no plan is a Dodo.
- **Roles:** entry, secondary and anchor, rated 0–3 per legend. Octane, Bangalore and Newcastle are the textbook examples.
- **A finer scale:** trait levels went from 0–2 to 0–3, so standouts can be told apart from merely good.
- **Mobility and loot:** mobility got a real weight. Loot is derived from mobility, with Loba and Alter as explicit exceptions.

Win-rate data from apexlegendsstatus was considered and rejected. It covers only top predator players, mixes legend strength with player skill, and says nothing about comps. Its pick rates did confirm that mobility was being undervalued.

## 7. Prototype before building

Rather than build straight into the page, the new scoring was prototyped as Node scripts that import the site's real model. Each variant ranked every possible comp so you could compare them. Interactive "tower" charts of every legend's traits showed which legends were dominating, and that guided your regrade: Valkyrie, then Bangalore, then Horizon. The prototype also caught a false positive: Valkyrie + Horizon + Gibraltar counted as a dive comp until a role requirement was added.

The final settings were a role gate of 0.6 and roles worth 12 points:
- Octane + Axle + Conduit rose from #2,682 to #71 by default, and #31 with Hawk picked.
- The top 12 now uses 16 different legends.
- The worst comps all come out as Dodos.

## 8. The current build

Plans are now in the site:
- a plan picker in tune, saved in share links;
- a plan badge on each result;
- each legend's role in the seating line;
- Plan, Punishes and Risks lines in the summary;
- gaps the plan doesn't care about greyed out;
- the plan's core traits highlighted on the radar.

**Still to come:**
- descriptive text for each plan;
- clearing the synergy backlog;
- the Playwright test suite;
- a quick solo-queue picker for building around teammates' hovers.

## Themes that could carry the post

- **Data you own vs code.** All the opinions live in one validated JSON file that you edit, while the code only reads it. That split let you regrade legends freely without ever touching code.
- **Review before features.** The PR-style review found real user-facing bugs, like share links overwriting your saved picks, that playing with the tool hadn't revealed.
- **Model the game the way players think.** The biggest improvement didn't come from tweaking weights. It came from adding the concepts your group already uses: plans, roles, ring position and counters.
- **Prototype, then build.** Ranking every comp offline made it possible to argue with the numbers before committing to UI.

## TODO

Rewrite this for apex-buddy