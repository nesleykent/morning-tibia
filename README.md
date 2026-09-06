# Morning Tibia

A daily Tibia world briefing generator. Pick a world, review (or correct) today's
conditions, and generate a polished, share-ready daily bulletin in Portuguese, English,
Spanish, or Polish — in under a minute.

**Live at [nesleykent.github.io/morning-tibia](https://nesleykent.github.io/morning-tibia/).**

Morning Tibia is inspired by the workflow of Tibiopedia's *Mini World Changes* tool, but
is an original implementation: original visual design, original code, and original
branding. It does not scrape or reuse Tibiopedia's UI, parsing logic, or assets.

## What it does

1. **A single top bar**, alongside the brand mark (not a card, not a second stacked bar
   below it) — a live countdown to the next 10:00 CET/CEST server save, a live countdown
   to the current Tibia Drome rotation's end, and the viewer-timezone selector,
   right-aligned. The timezone dropdown mirrors [nesleykent's tibia-warzones-schedule
   tool](https://nesleykent.github.io/tibia-warzones-schedule/) — same city list, same
   "City (GMT±N)" labels (`lib/utils/timezoneList.ts`) — for a consistent experience
   across both. Defaults to Curitiba (`America/Sao_Paulo`) rather than auto-detecting the
   browser's zone — there's no "Auto" option; the viewer always has one explicit zone
   picked. The chosen timezone drives the generated briefing text and every time shown
   anywhere else in the app, since it's written for whoever is about to read it, not for
   the world's own server clock. Its state is shared through `ViewerSettingsContext`
   between this layout-level bar and the dashboard beneath it — one source of truth, not
   two copies that could drift apart.
2. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), one or more boosted regions
   (multi-select, picked from a curated list of real Tibia locations — not free text),
   today's warzone schedule (each execution shown as `12:00 (1-2-3)`, already converted
   to your timezone), and a unified **Events** card mixing active and upcoming events
   (active ones flagged with a badge) with a 5/7/14-day window control for how far ahead
   it reaches. The Tibia Drome rotation itself lives in the top status bar's countdown,
   not as a separate card.
3. **Two distinct Tibia mechanics, tracked separately** — Mini World Changes and World
   Changes are different systems with different in-game sources, so they get separate
   sections and separate data models — never merged. Everything below was verified entry by
   entry against TibiaWiki's ["Mini World Changes"](https://tibia.fandom.com/wiki/Mini_World_Changes),
   ["The World Board"](https://tibia.fandom.com/wiki/The_World_Board),
   ["Towncryer"](https://tibia.fandom.com/wiki/Towncryer) and
   ["World Changes"](https://tibia.fandom.com/wiki/World_Changes) articles plus each
   change's own page, and cross-checked against live Guide NPC transcripts.

   **Mini World Changes** — 24 exist; 23 are cards here and the 24th, *Oriental Trader*, is
   Yasir's merchant card (see below) rather than a duplicate. Two sources report them, and
   they are modelled separately because they carry different amounts of information:

   - **The World Board** (Adventurer's Guild floor +1, near Charos) prints one line per
     *currently active* change. Being an exhaustive listing, a **complete** reading is the
     only evidence in the whole app that can prove a negative.
   - **The Towncryer** (Thais, around the depot and docks) shouts one change at a time. It
     can never prove a negative — but for **Jungle Camp** it is the only in-game way to
     learn which side is winning, since the board's single line names neither.

   **World Changes** — 14, one per official Guide NPC keyword. Greet any Guide, say *world
   change*, then the keyword; the card shows the exact keyword to say. TibiaWiki lists a
   15th, **Insectoid Invasion** (Greenshore), which is deliberately *not* tracked: it has no
   Guide keyword, so no player can check it remotely, and it isn't a Mini World Change
   either (no board or Towncryer message), so a permanently-unanswerable card would be pure
   noise.

   A single **Import from game text** panel accepts a World Board log, a Guide chat log and
   Towncryer shouts in any combination — the three catalogs share no text, so nothing can be
   mistaken for anything else. (Tibiopedia uses two separate boxes; one is strictly less
   work and costs nothing in accuracy.) See [lib/parser](lib/parser).

   **What the app is allowed to conclude.** The board's own opening line ("You see the world
   board. This board will notify you…") is the *only* thing that marks a paste as a complete
   reading, and therefore the only thing that lets an unmentioned change be recorded as not
   running — see [`parseBoardLog.ts`](lib/parser/parseBoardLog.ts). A fragment, a Guide log,
   or a Towncryer shout never does. Four knowledge states are distinguished, matching what a
   player can actually know:

   | State | Meaning | How it arises |
   |---|---|---|
   | `unchecked` | No evidence at all. Never shown as "inactive", never enters the briefing. | Default |
   | `inactive` | Confirmed not running. | A **complete** board reading that omits it |
   | `active`, no variant | Confirmed running; the source couldn't say which form. | e.g. Fury Gates, Nomads, Warpath |
   | `active` + variant | Confirmed running, and which one. | Board/Towncryer wording, or the player |

   **Variants exist only where the game has them** — seven of the 23. *Fury Gates* opens at
   one of **10 cities** and no source ever names it; *Nomads* is one of **4 camps** in
   Kha'labal ("only one out of four can be found"); *Warpath* is one of **3 spots**;
   *Jungle Camp* is Hunters **or** Dworcs, which also decides the boss (Arthom the Hunter vs
   Oodok Witchmaster); *Poacher Caves*, *Spirit Grounds* and *Nightmare Isles* have variants
   the board itself names. Everything else is simply running or not — and *Noodles is Gone*
   deliberately has **no** location state at all, because the board never says where he is
   and he wanders the whole Thaian peninsula; his known server-save spawn areas are shown as
   a hint, never as something the app claims to know.

4. **Merchants & market** — Yasir travels between exactly 3 cities (Carlin, Liberty Bay,
   Ankrahmun — confirmed against TibiaWiki, this is the "Oriental Trader" Mini World
   Change), so his location is a closed pick list, not free text; the World Board's
   "Oriental ships sighted…" message auto-fills it via the import panel. His card carries
   an explicit `activityState` badge — **Not verified** (nothing checked this session yet),
   **Active — pending city** (the board confirms he's trading but a city hasn't been picked
   yet), **Active** (city known), or **Inactive** (a complete board reading didn't mention
   him at all) — so "we haven't checked" and "we checked and he's not around" never look
   the same (`types/merchant.ts`'s `MerchantActivityState`). Rashid's location is computed
   from Tibia's own clock (the fixed weekday rotation, resolved against Europe/Berlin time
   and rolled over at the 10:00 CET/CEST server save rather than local midnight, DST-safe)
   and shown fully **read-only** — unlike Yasir, there's no known exception to correct, so
   it isn't even a picker, just plain text, and his `activityState` is always the fixed
   "location-known". Tibia Coin Sell Offer, Tibia Coin Buy Offer, Gold Token Sell Offer,
   and Silver Token Sell Offer prices — named literally after the underlying market-order
   fields, not reinterpreted into a "what the player pays/receives" framing — are **fully
   read-only**, the same reasoning as Rashid: nobody can know the current market price
   better than the data itself, so a manual override could only ever be wrong. Rather than
   a live current-tick API (which only ever gives one snapshot per page load, leaving
   almost nothing for a trend to compare against), Morning Tibia sources real day-by-day
   history — the same published dataset [nesleykent/tibia-warzones-schedule](https://github.com/nesleykent/tibia-warzones-schedule)'s
   own trend/ranking calculations are built on (years of daily `day_average_sell`/
   `day_average_buy` entries) — giving every price meaningful history from the very first
   load. A basis selector on the dashboard (Last entry / Avg 3 / Avg 7 / Avg 14 entries,
   `lib/utils/priceTrend.ts`) controls both the shown gp figure and the up/down/unchanged
   trend arrow: the trend compares that basis's average including the latest entry against
   the same basis computed one entry earlier, so "Avg 7" reflects whether the 7-entry (day)
   average actually moved, not just whether the single newest tick did. An "as of X ago"
   snapshot-freshness label (next to an **auto** badge meaning "sourced automatically", not
   literally "this second" — the dataset itself refreshes about once a day) also appears in
   the generated briefing text next to the price, which itself reflects the same selected
   basis.
5. **Briefing generator** — turns all of the above into a formatted daily message (rich
   WhatsApp-style with `*bold*` and emoji, or a plain-text variant) in your choice of
   Portuguese, English, Spanish, or Polish, with one-click Copy, Copy plain text, Share
   (native share sheet with a clipboard fallback), Reset, and Refresh. **Mini World
   Changes** and **World Changes** get their own separate sections in the generated text
   (they used to share one "Achievements & Bosses" section, which conflated two different
   mechanics) — and each section's "nothing to show" state distinguishes *nothing has been
   checked yet this session* from *it was checked and genuinely nothing is active*, instead
   of a single generic "no active changes" line for both cases. Both sections read as
   short, human-written sentences instead of a bare status symbol — e.g. "Os Shaburak
   convocaram seus líderes e dominam o complexo," not "✅ Stage 2" — sourced from
   [`lib/formatter/worldChangeNarratives.ts`](lib/formatter/worldChangeNarratives.ts) and
   [`lib/formatter/miniWorldChangeNarratives.ts`](lib/formatter/miniWorldChangeNarratives.ts),
   fully localized across all 4 languages; a few World Changes (Demon War, Awash,
   Overhunting, Thornfire) even vary their wording by the parsed detail (which faction is
   winning, whether today's quota was met).
6. **Editing workflow** — every editable field is inline-editable; manual corrections are
   saved per world/day in `localStorage` so a recurring user can update quickly without
   re-entering everything. Loading an older save after a data-model change (a renamed
   field, a new category) backfills whatever's missing from current defaults instead of
   breaking — see `mergeOverridesWithDefaults` in `lib/defaults/index.ts`.

## Data sources

Morning Tibia treats "no reliable public source" as an expected state, not an error — the
app never blocks on a missing data source; fields with no live source ship with sensible
defaults and stay manually editable.

| Data | Source | Notes |
|---|---|---|
| World list, PvP type, BattlEye, transfer type, online count, boosted creature/boss | [TibiaData API v4](https://docs.tibiadata.com/) | Public, no auth, CORS-open — fetched directly from the browser (`lib/data/worldProvider.ts`). |
| Warzone schedule | [nesleykent/tibia-warzones-schedule](https://nesleykent.github.io/tibia-warzones-schedule/) (published `data/worlds.json`) | Also CORS-open, fetched directly from the browser. Includes the world's IANA timezone (`lib/utils/timezone.ts`); every displayed time — dashboard card and generated briefing alike — is converted to the viewer's own selected timezone. |
| Tibia Coin, Gold Token, Silver Token sell/buy offers | [nesleykent/tibia-warzones-schedule](https://github.com/nesleykent/tibia-warzones-schedule) (published `data/market/world/{World}/{world}_{item}.json`, one file per item per world) | CORS-open, re-fetched every 15 minutes while the dashboard is open (`lib/data/marketHistoryMapping.ts` + `worldProvider.ts`). Fully read-only — no manual override. Real day-by-day history (years of `day_average_sell`/`day_average_buy` entries, refreshed upstream about once a day) rather than a single current-tick snapshot, so the trend/average basis selector has genuine data from the first load. Mapping is literal — our `*Sell`/`*Buy` price ids hold exactly that field, with no reinterpretation into a "what the player pays/receives" framing (see `hooks/useBriefingState.ts`). |
| Active events, upcoming events, Tibia Drome rotation | [TibiaWiki](https://tibia.fandom.com/) gadget pages (`Active_Events`, `Upcoming_Events`, `Tibiadrome/Rotation`) — community-maintained live mirrors of tibia.com's own event calendar (which sits behind a Cloudflare bot check and can't be fetched directly) and Tibiadrome's documented fixed bi-weekly rotation | Fetched **at build time** via the MediaWiki API (`lib/data/wikiContentClient.ts`), since that API doesn't send CORS headers and can only be called server-side. A scheduled GitHub Actions rebuild (every 6h, see `.github/workflows/deploy.yml`) keeps it current. Read-only in the UI — not user-editable. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation, resolved against Europe/Berlin time and rolled over at the 10:00 CET/CEST server save (not local midnight) — DST-safe. Shown read-only in the UI; there's no known case where it needs correcting. |
| All 14 World Changes | Guide NPC chat log, pasted by the user, parsed against [verbatim reply text](lib/parser/guideMessages.ts) | One keyword per change (`guideKeyword`), shown on the card. A reply establishes one documented state; silence about a keyword only ever means "not asked". Each card also has a picker limited to that change's documented states, for a player who read the reply but didn't copy it. |
| The 23 Mini World Changes | World Board server log **and/or** Towncryer shouts, parsed against [board text](lib/parser/boardMessages.ts) and [Towncryer text](lib/parser/towncryerMessages.ts) | A recognised line proves the change is running, plus its variant where the wording names one. Only a **complete** board reading — identified by the board's own preamble, see [`parseBoardLog.ts`](lib/parser/parseBoardLog.ts) — records unmentioned changes as not running; a fragment, a Guide log or a Towncryer shout never does. |
| Which variant a running change has (7 of the 23) | Board/Towncryer wording where it names one; otherwise the player | Closed pick list of the real possibilities, enabled only once a source has confirmed the change is running — a picker can never manufacture activity. Fury Gates (10 cities), Nomads (4 camps) and Warpath (3 spots) are normally player-supplied, since no in-game source names them. |
| Yasir's location (3 possible cities) | The "Oriental Trader" message on the board, or the Towncryer's version of it | Trading with the city pending until one is picked — closed pick list, no free text. A complete board reading that omits it marks him confirmed not trading, rather than merely unverified. |
| Boosted region | Manual, local | No source of any kind — multi-select from a curated location list. |

## Architecture

```
app/
  layout.tsx           — root shell: single top bar (brand + TopStatusBar), wraps
                          everything in ViewerSettingsProvider; also fetches Drome at
                          build time for the status bar's countdown
  page.tsx             — async Server Component: fetches events/Drome at build time,
                          passes them into the client dashboard as props
  globals.css
components/
  ui/            — hand-written shadcn-style primitives (Radix UI + CVA)
  dashboard/     — TopStatusBar (server-save + Drome countdowns, timezone selector —
                   lives inline in layout.tsx's bar, not a bar of its own), WorldSelector,
                   DailyHeader, ImportGameTextCard, BoostedCard (multi-select boosted
                   region), MiniWorldChangeGrid, WorldChangeGrid (both split into
                   Auto / Needs-your-input sections), MerchantCard (Yasir is a closed
                   3-city pick list, not free text; Rashid is read-only plain text — no
                   known exception ever needs correcting), MarketPriceCard
                   (3/7/14-day average selector), WarzoneScheduleCard, EventCard
                   (unified active + upcoming Events card), BriefingPreview, CopyButton,
                   ToolbarActions, …
hooks/
  useBriefingState.ts   — the single orchestrating hook: live client queries + build-time
                           event/Drome props + persisted overrides + derived briefing
                           text; reads the viewer timezone from ViewerSettingsContext
                           rather than keeping its own copy
  useCopyToClipboard.ts, useIsClient.ts
lib/
  context/       — ViewerSettingsContext.tsx: the one shared source of truth for the
                   viewer-timezone override, read by both the layout-level TopStatusBar
                   (above the page) and useBriefingState (inside the page) — they don't
                   share a React tree position, so this avoids two independent copies of
                   the same localStorage value drifting apart
  data/          — worldProvider.ts (client hooks fetching TibiaData and
                   tibia-warzones-schedule directly — both CORS-open, so this works from a
                   static, server-less deploy), tibiaDataMapping.ts (pure, unit tested),
                   marketHistoryMapping.ts (pure, unit tested — parses the market history
                   JSON worldProvider.ts fetches), wikiContentClient.ts (build-time-only
                   TibiaWiki fetcher, unit tested)
  parser/        — boardMessages.ts / towncryerMessages.ts / guideMessages.ts (verbatim
                   catalogs, one per in-game source) + parseBoardLog.ts (which alone can
                   report a complete reading, via the board's own preamble) /
                   parseTowncryerLog.ts / parseGuideLog.ts (positives only), combined into
                   parseGameText.ts so one paste is checked against all three at once and
                   only the board can ever conclude something is not running — all unit
                   tested
  formatter/     — generateBriefing.ts (pure, no React import) + translations.ts
                   (PT/EN/ES/PL section labels) + worldChangeNarratives.ts /
                   miniWorldChangeNarratives.ts (the per-state narrative text catalogs),
                   unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — the Mini World Change / World Change catalogs (names, locations,
                   variants, Guide keywords, documented states), tibiaLocations.ts (the
                   curated location list used for boosted region), plus
                   mergeOverridesWithDefaults for safely loading an older localStorage
                   save (migrating the old single boostedRegion string into
                   boostedRegions: string[], an old market price's previousValue into a
                   history array, an old stored trend field — now always derived on the
                   fly instead — a pre-activityState merchant save, and a Bibby/Noodles
                   detail that's no longer in the closed list back to "active, pending")
  utils/         — cn, date/timezone/time-ago helpers, serverSave.ts (next 10:00
                   CET/CEST occurrence, DST-safe), timezoneList.ts (the viewer-timezone
                   options and DEFAULT_VIEWER_TIME_ZONE), priceTrend.ts (entry-count-based
                   average/trend calculator, see lib/utils/priceTrend.ts)
types/           — one file per domain concept (World, MiniWorldChange, WorldChange,
                   Merchant, …) — miniWorldChange.ts and worldChange.ts are intentionally
                   separate types, matching the two distinct in-game mechanics
```

Data fetching is separated from UI: components never call `fetch` directly, only
`lib/data/*` and `hooks/useBriefingState.ts` do — so a data source can be replaced by
editing one file. Persistence is behind the `BriefingRepository` interface
(`lib/storage/briefingRepository.ts`); swapping `localStorage` for a real backend later
means implementing that interface once.

The app ships as a fully static site (`next.config.ts` sets `output: "export"`) — there
is no server at runtime. Everything that can be fetched from the browser (TibiaData,
tibia-warzones-schedule) is; everything that can only be fetched server-side due to CORS
(TibiaWiki) is resolved once at build time and baked into the static HTML, refreshed by a
scheduled CI rebuild.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build   # static export → ./out
npm run start   # serve ./out locally (via `serve`) to preview the production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which lints, typechecks,
tests, builds the static export (with `GITHUB_PAGES=true` so `next.config.ts` sets the
`/morning-tibia` base path), and publishes `./out` to GitHub Pages. The same workflow
also runs on a 6-hour schedule to refresh the build-time TibiaWiki data.

## Other scripts

```bash
npm run lint        # ESLint (flat config, next/core-web-vitals + next/typescript)
npm run typecheck   # tsc --noEmit
npm test            # Vitest — formatter, parsers, timezone/time-ago, Rashid rotation, etc.
```

## Current limitations

- Fury Gates, Nomads and Warpath normally need the player to say *where*: no in-game
  source names the city/camp/spot, so the board can only ever confirm that they're running.
  That's the mechanic, not a gap in the app. Boosted region has no source at all.
- "Insectoid Invasion" is a real World Change but has no Guide NPC keyword, so it can't be
  checked remotely and isn't tracked — see the data source table above.
- The upcoming-events section of the generated briefing only reaches as far as the
  selected day window (5/7/14 days) — further-out events still show on the dashboard's
  own Upcoming events card, just not in the generated text.
- Swamp Fever has only one Guide reply publicly transcribed (the calm state), so only that
  state auto-detects. A few replies (Horse Station's "working normally", and the
  non-primary Mage Tower / Thornfire / Master's Voice states) come from secondary fan
  sources and are marked `unverifiedWording` in
  [`lib/parser/guideMessages.ts`](lib/parser/guideMessages.ts) — if the wording is slightly
  off, the parser simply doesn't match it rather than reporting a wrong state.
- Timezone conversion for the warzone schedule compares UTC offsets for a single
  reference date rather than doing full calendar-aware conversion — it can be off by a
  day boundary or mid-window DST transition in rare edge cases. (Rashid's rotation uses a
  precise `Intl`-based conversion instead, so it isn't affected by this.)
- Active events, upcoming events, and the Tibia Drome rotation are as fresh as the last
  deploy (scheduled every 6 hours), not truly real-time — there's no server to poll them
  live from a static GitHub Pages site.
- Mini World Change / World Change item names in the generated briefing stay in their
  canonical English Tibia names regardless of briefing language (translating ~40 in-game
  proper names into 4 languages was out of scope) — only section headers, labels, and the
  greeting are localized.
- No `backdrop-filter`/`backdrop-blur` anywhere in the app on purpose — Safari has a
  known bug where it corrupts paint/hit-testing for portalled popover content (our
  Select/Popover dropdowns) when applied to a `position: sticky` or `fixed` ancestor.
  Fixed surfaces (the top bar, the mobile action bar) use a plain solid background
  instead; it's simpler and avoids the whole bug class.
- Persistence is `localStorage`-only — overrides are per browser/device, not synced
  across devices or shared with a guild.
- "Complete snapshot" inference (an unmentioned Mini World Change, or Yasir, treated as
  inactive) only fires when the World Board's own fixed preamble text is present in the
  paste — a genuinely complete board reading that's missing that first line (trimmed
  before copying, for instance) is treated as a fragment instead, and nothing gets
  auto-marked inactive. This is intentional: it's a much safer failure mode than guessing
  "complete" from a fragment and wrongly clearing an active change.
- A market trend needs at least 2 *distinct* observed values in a price's history before
  it can show anything other than ➡️ (unchanged) — that's by design, not a bug: there's
  nothing to compare with only one observation. The published day-by-day history (see the
  Data sources table) means this is essentially never an issue in practice, except for a
  world with no market activity/history recorded upstream yet, or a genuinely flat
  real-world price, which will — correctly — still show ➡️.

## How to add a new Mini World Change or World Change

Mini World Changes (World Board) and World Changes (Guide NPC) are separate lists — add
to the one that matches the in-game mechanic:

- Mini World Change → add to `MINI_WORLD_CHANGE_DEFINITIONS` in
  [`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts), then add its
  verbatim board line to [`boardMessages.ts`](lib/parser/boardMessages.ts) and its
  Towncryer shout to [`towncryerMessages.ts`](lib/parser/towncryerMessages.ts). Give it
  `variants` **only** if the game really has distinct forms, and set `boardNamesVariant` /
  `towncryerNamesVariant` from whether that source's wording actually names one — if it
  doesn't, leave `variantId` off the message rather than picking a plausible value.
- World Change → add to `WORLD_CHANGE_DEFINITIONS` in
  [`lib/defaults/worldChanges.ts`](lib/defaults/worldChanges.ts) with its official
  `guideKeyword` and its documented `states`, then add verbatim reply text per state to
  [`guideMessages.ts`](lib/parser/guideMessages.ts). Mark any wording you couldn't verify
  against a primary source with `unverifiedWording: true`.

Either way, add localized narrative text for every new state/variant — a test asserts full
PT/EN/ES/PL coverage — and `lib/defaults/catalogIntegrity.test.ts` will check the catalogs
and message files agree.

```ts
// Mini World Change
{
  id: "unique-id",
  name: "Canonical TibiaWiki Name",
  shortLabel: "Short Name",
  emoji: "✨",
  location: "Where it happens, per TibiaWiki's Location field",
  variants: [],          // only if the game really has distinct forms
  variantKind: null,     // "location" | "faction" | "phase"
  boardNamesVariant: false,
  towncryerNamesVariant: false,
  description: "One line describing what this tracks.",
}

// World Change
{
  id: "unique-id",
  name: "Canonical TibiaWiki Name",
  shortLabel: "Short Name",
  emoji: "✨",
  guideKeyword: "Keyword",   // exactly what you say to a Guide NPC
  location: "Where it happens",
  states: [{ id: "quiet-state", label: "Nothing happening", quiet: true }],
  description: "One line describing what this tracks.",
}
```

Both grids and `createDefaultMiniWorldChangeValues()` / `createDefaultWorldChangeValues()`
pick new entries up automatically — no other file needs to change. A `quiet` World Change
state is still real, confirmed knowledge, but it's only printed in the briefing when
"Include everything" is on (see `lib/formatter/briefingModel.ts`).

## How to change the generated briefing format

The formatter is intentionally isolated from React:

- [`lib/formatter/translations.ts`](lib/formatter/translations.ts) holds the section
  headers, field labels, and greeting for each supported language (PT/EN/ES/PL).
- [`lib/formatter/briefingModel.ts`](lib/formatter/briefingModel.ts) turns raw app state
  (plus the selected language) into a flat, render-agnostic `BriefingModel`.
- [`lib/formatter/generateBriefing.ts`](lib/formatter/generateBriefing.ts) renders that
  model two ways — `renderRichBriefing` (WhatsApp-style, `*bold*` + emoji) and
  `renderPlainBriefing` (no markdown, no emoji) — and exports
  `generateBriefingMessage` / `generatePlainTextBriefing` as the public API.
- [`lib/formatter/worldChangeNarratives.ts`](lib/formatter/worldChangeNarratives.ts) holds
  the human-written headline/body/extra text per World Change and state, in all 4
  languages — `getWorldChangeNarrative(changeId, state, detail, language)` — with a
  `detail`-driven variant for states whose wording depends on parsed context (which
  faction is winning, whether a daily quota was met). A state with no entry here falls
  back to the compact ✅/stage line instead of disappearing.
- [`lib/formatter/miniWorldChangeNarratives.ts`](lib/formatter/miniWorldChangeNarratives.ts)
  is the same idea for Mini World Changes — `getMiniWorldChangeNarrative(changeId, state,
  detail, language)` — one sentence per state, with the parsed location interpolated for
  location-type changes.

To add a new language, add an entry to `translations.ts`'s `TRANSLATIONS` map and to
`BRIEFING_LANGUAGES`. To change wording, section order, or add a new section, edit the
relevant `render*` function; to change what data feeds a section, edit
`buildBriefingModel`. All of this is covered by `lib/formatter/generateBriefing.test.ts`.

## License

MIT — see [LICENSE](LICENSE).
