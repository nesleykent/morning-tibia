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
   across both. The chosen timezone (auto-detected from the browser by default, manually
   overridable) drives the generated briefing text and every time shown anywhere else in
   the app, since it's written for whoever is about to read it, not for the world's own
   server clock. Its state is shared through `ViewerSettingsContext` between this
   layout-level bar and the dashboard beneath it — one source of truth, not two copies
   that could drift apart.
2. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), one or more boosted regions
   (multi-select, picked from a curated list of real Tibia locations — not free text),
   today's warzone schedule (each execution shown as `12:00 (1-2-3)`, already converted
   to your timezone), and a unified **Events** card mixing active and upcoming events
   (active ones flagged with a badge) with a 5/7/14-day window control for how far ahead
   it reaches. The Tibia Drome rotation itself lives in the top status bar's countdown,
   not as a separate card.
3. **Two distinct Tibia mechanics, tracked separately** — Mini World Changes (announced
   on the World Board at the Adventurer's Guild — 23 of the canonical 24, the 24th being
   Yasir's location, see below) and World Changes (checked in-game by asking a Guide NPC —
   14 with documented reply text) are different game systems with different in-game
   sources, so they get separate sections and separate data models — never merged. Three
   entries that were previously miscategorized here have been removed after verifying
   against TibiaWiki: "Roshamuul" (a quest-unlocked town, not Board or Guide-NPC checked
   at all), "Overhunting Creature" (actually a World Change, already modeled correctly as
   `overhunting-deer`), and "Dream Courts Arena Boss" (a separate "Boss of the Day"
   system with no Board text or Guide NPC keyword). A dedicated **Import from game text**
   panel — front and center on the dashboard, not hidden behind a button — recreates
   Tibiopedia's paste-and-parse workflow with original code: a single paste box accepts
   either or both logs at once and both catalogs are checked automatically, since the two
   mechanics' source text never collides. Within each mechanic, every entry is split into
   **Auto** (the board/Guide NPC text always gives the complete state, so the card is
   read-only, populated only by pasting a log — no pointless manual dropdown next to
   something only the game itself can tell you) and **Needs your input** (the text only
   confirms the change is active without the exact stage or spot, so that detail stays
   editable after import). See [lib/parser](lib/parser).
4. **Merchants & market** — Yasir travels between exactly 3 cities (Carlin, Liberty Bay,
   Ankrahmun — confirmed against TibiaWiki, this is the "Oriental Trader" Mini World
   Change), so his location is a closed pick list, not free text; the World Board's
   "Oriental ships sighted…" message auto-fills it via the import panel. Rashid's location
   is computed from Tibia's own clock (the fixed weekday rotation, rolled over at the
   10:00 CET/CEST server save rather than local midnight) and, like Yasir, is a closed
   pick list of the 7 known cities — always correctable if today's happens to differ, but
   never free text either. Live Tibia
   Coins (Sell), Tibia Coins (Buy), Gold Token (Sell), and Silver Token (Sell) prices
   keep a bounded rolling history of distinct observed values (not a daily series — the
   feed doesn't update every day, so a new entry is only recorded when the price actually
   changes), driving an up/down/unchanged trend from the last 3 entries (not a naive
   two-point comparison), a 3/7/14-day average selector on the dashboard, and an "X ago"
   freshness label that also appears in the generated briefing text next to the price.
5. **Briefing generator** — turns all of the above into a formatted daily message (rich
   WhatsApp-style with `*bold*` and emoji, or a plain-text variant) in your choice of
   Portuguese, English, Spanish, or Polish, with one-click Copy, Copy plain text, Share
   (native share sheet with a clipboard fallback), Reset, and Refresh. Both World Changes
   and Mini World Changes read as short, human-written sentences instead of a bare status
   symbol — e.g. "Os Shaburak convocaram seus líderes e dominam o complexo," not "✅ Stage
   2" — sourced from
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
| Tibia Coin, Gold Token, Silver Token buy/sell prices | [api.tibiamarket.top](https://api.tibiamarket.top/docs) | CORS-open. Returns a timestamp per snapshot, shown as a freshness label ("Xm ago"). "Sell price" (what you receive) maps to the current highest buy offer; "buy price" (what you pay) maps to the current lowest sell offer. |
| Active events, upcoming events, Tibia Drome rotation | [TibiaWiki](https://tibia.fandom.com/) gadget pages (`Active_Events`, `Upcoming_Events`, `Tibiadrome/Rotation`) — community-maintained live mirrors of tibia.com's own event calendar (which sits behind a Cloudflare bot check and can't be fetched directly) and Tibiadrome's documented fixed bi-weekly rotation | Fetched **at build time** via the MediaWiki API (`lib/data/wikiContentClient.ts`), since that API doesn't send CORS headers and can only be called server-side. A scheduled GitHub Actions rebuild (every 6h, see `.github/workflows/deploy.yml`) keeps it current. Read-only in the UI — not user-editable. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation, resolved against Europe/Berlin time and rolled over at the 10:00 CET/CEST server save (not local midnight) — DST-safe, always overridable. |
| All 14 World Changes with a documented Guide NPC reply (Hive Born, Horestis, Deeplings, Sea Serpent, Demon War, Twisted Waters, Awash, Steamship, Overhunting, The Mage's Tower, Their Master's Voice, Thornfire, Swamp Fever, Horse Station) | Guide NPC chat log, pasted by the user, parsed against [documented verbatim reply text](lib/parser/guideMessages.ts) | Read-only in the grid — populated only via the import panel. |
| 21 of the 23 modeled Mini World Changes (`coverage: "full"` in [`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts)) | World Board server log, pasted by the user, parsed against [documented verbatim board text](lib/parser/boardMessages.ts) | Read-only — the board always gives the complete state for these. |
| Yasir's location (3 possible cities) | World Board's "Oriental Trader" message, parsed as a merchant hint | Read-only pick list otherwise — no free text, since there's no 4th option. |
| The other 2 Mini World Changes (`coverage: "partial"` — Bibby's Bloodbath, Noodles), boosted region | Manual, local | The board confirms these are active but never names a location (verified across every revision the board's wiki page has ever had), so that detail stays user-editable after import. Boosted region has no source at all — multi-select from a curated location list instead of free text. |

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
                   Auto / Needs-your-input sections), MerchantCard (both Yasir and
                   Rashid are closed pick lists, not free text), MarketPriceCard
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
  data/          — worldProvider.ts (client hooks fetching TibiaData, tibia-warzones-
                   schedule, and tibiamarket.top directly — all CORS-open, so this works
                   from a static, server-less deploy), tibiaDataMapping.ts (pure, unit
                   tested), wikiContentClient.ts (build-time-only TibiaWiki fetcher, unit
                   tested), marketItemIds.ts
  parser/        — boardMessages.ts / guideMessages.ts (verbatim catalogs, one per
                   mechanic) + parseBoardLog.ts / parseGuideLog.ts, combined into a single
                   parseGameText.ts so the import panel can check one paste against both
                   catalogs at once — all unit tested
  formatter/     — generateBriefing.ts (pure, no React import) + translations.ts
                   (PT/EN/ES/PL section labels) + worldChangeNarratives.ts /
                   miniWorldChangeNarratives.ts (the per-state narrative text catalogs),
                   unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — seed data for every manual field, tibiaLocations.ts (the shared
                   curated location list for boosted region / suggestions), plus
                   mergeOverridesWithDefaults for safely loading an older localStorage
                   save (including migrating the old single boostedRegion string into
                   boostedRegions: string[], and an old market price's previousValue
                   into a history array)
  utils/         — cn, date/timezone/time-ago helpers, serverSave.ts (next 10:00
                   CET/CEST occurrence, DST-safe), timezoneList.ts (the viewer-
                   timezone override options), price-trend calculator
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
tibia-warzones-schedule, tibiamarket.top) is; everything that can only be fetched
server-side due to CORS (TibiaWiki) is resolved once at build time and baked into the
static HTML, refreshed by a scheduled CI rebuild.

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

- 2 Mini World Changes (Bibby's Bloodbath, Noodles) and boosted region are manual by
  design — the World Board confirms these are active but never names a location, and
  there's no API for boosted region at all ("Insectoid Invasion" isn't a
  Guide-NPC-checkable mechanic either, so it isn't listed as one — see the data source
  table above).
- The upcoming-events section of the generated briefing only reaches as far as the
  selected day window (5/7/14 days) — further-out events still show on the dashboard's
  own Upcoming events card, just not in the generated text.
- Several World Changes (Swamp Fever, Horse Station, and a couple of others) only have
  one state's Guide NPC reply publicly documented, not the full escalation — those
  changes auto-detect for that one state and stay manually correctable for the rest.
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
- Persistence is `localStorage`-only — overrides are per browser/device, not synced
  across devices or shared with a guild.

## How to add a new Mini World Change or World Change

Mini World Changes (World Board) and World Changes (Guide NPC) are separate lists — add
to the one that matches the in-game mechanic:

- Mini World Change → add to `MINI_WORLD_CHANGE_DEFINITIONS` in
  [`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts) (needs a
  `coverage` of `"full"` or `"partial"` — only set `"full"` if
  [`lib/parser/boardMessages.ts`](lib/parser/boardMessages.ts) gives the complete state
  for every case, not just an "it's active" confirmation).
- World Change → add to `WORLD_CHANGE_DEFINITIONS` in
  [`lib/defaults/worldChanges.ts`](lib/defaults/worldChanges.ts) (needs a `source` of
  `"manual"` or `"guide-npc"` — only set `"guide-npc"` if
  [`lib/parser/guideMessages.ts`](lib/parser/guideMessages.ts) has exact, verbatim reply
  text for it).

```ts
{
  id: "unique-id",
  label: "Display Name",
  shortLabel: "Short Name",
  emoji: "✨",
  controlType: "toggle", // toggle | stage | location | creature | boss
  description: "One line describing what this tracks.",
}
```

Both grids and `createDefaultMiniWorldChangeValues()` / `createDefaultWorldChangeValues()`
pick new entries up automatically — no other file needs to change. `controlType`
determines which inline editor renders (`StatusSelector`, `StageSelector`, or a text
input with suggestions); it feeds into how the item is formatted in the generated
briefing (see `lib/formatter/briefingModel.ts`).

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
