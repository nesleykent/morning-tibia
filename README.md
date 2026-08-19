# Morning Tibia

A daily Tibia world briefing generator. Pick a world, review (or correct) today's
conditions, and generate a polished, share-ready daily bulletin in Portuguese, English,
Spanish, or Polish — in under a minute.

**Live at [nesleykent.github.io/morning-tibia](https://nesleykent.github.io/morning-tibia/).**

Morning Tibia is inspired by the workflow of Tibiopedia's *Mini World Changes* tool, but
is an original implementation: original visual design, original code, and original
branding. It does not scrape or reuse Tibiopedia's UI, parsing logic, or assets.

## What it does

1. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), boosted region, today's
   warzone schedule (shown in the world's own timezone *and* yours, since a world's
   playerbase and a visitor's browser are rarely in the same one), live Tibia Drome
   rotation, and live official Active/Upcoming events.
2. **Two distinct Tibia mechanics, tracked separately** — Mini World Changes (announced
   on the World Board at the Adventurer's Guild) and World Changes (checked in-game by
   asking a Guide NPC) are different game systems with different in-game sources, so they
   get separate sections and separate data models — never merged. A dedicated **Import
   from game text** panel — front and center on the dashboard, not hidden behind a
   button — recreates Tibiopedia's paste-and-parse workflow with original code: a single
   paste box accepts either or both logs at once (a World Board server log and/or a Guide
   NPC chat log) and both catalogs are checked automatically, since the two mechanics'
   source text never collides. The **12 World Changes with an exact, documented Guide NPC
   reply for at least one state** (Hive Born, Horestis, Deeplings, Sea Serpent, Demon War,
   Twisted Waters, Awash, Steamship, Overhunting, The Mage's Tower, Their Master's Voice,
   Thornfire) are populated *only* that way and shown read-only; the rest (Swamp Fever,
   Horse Station, Insectoid Invasion) have no publicly documented Guide NPC reply text and
   stay directly editable. See [lib/parser](lib/parser).
3. **Merchants & market** — Yasir and Rashid's location (Rashid defaults to the known
   weekday rotation, always editable), live Tibia Coin buy/sell, Gold Token, and Silver
   Token prices with automatic up/down/unchanged trend indicators and an "X minutes ago"
   freshness label for every live price.
4. **Briefing generator** — turns all of the above into a formatted daily message (rich
   WhatsApp-style with `*bold*` and emoji, or a plain-text variant) in your choice of
   Portuguese, English, Spanish, or Polish, with one-click Copy, Copy plain text, Share
   (native share sheet with a clipboard fallback), Reset, and Refresh.
5. **Editing workflow** — every editable field is inline-editable; manual corrections are
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
| Warzone schedule, warzone health | [nesleykent/tibia-warzones-schedule](https://nesleykent.github.io/tibia-warzones-schedule/) (published `data/worlds.json`) | Also CORS-open, fetched directly from the browser. Includes the world's IANA timezone, used to show times in both the world's zone and the viewer's (`lib/utils/timezone.ts`). |
| Tibia Coin, Gold Token, Silver Token buy/sell prices | [api.tibiamarket.top](https://api.tibiamarket.top/docs) | CORS-open. Returns a timestamp per snapshot, shown as a freshness label ("Xm ago"). "Sell price" (what you receive) maps to the current highest buy offer; "buy price" (what you pay) maps to the current lowest sell offer. |
| Active events, upcoming events, Tibia Drome rotation | [TibiaWiki](https://tibia.fandom.com/) gadget pages (`Active_Events`, `Upcoming_Events`, `Tibiadrome/Rotation`) — community-maintained live mirrors of tibia.com's own event calendar (which sits behind a Cloudflare bot check and can't be fetched directly) and Tibiadrome's documented fixed bi-weekly rotation | Fetched **at build time** via the MediaWiki API (`lib/data/wikiContentClient.ts`), since that API doesn't send CORS headers and can only be called server-side. A scheduled GitHub Actions rebuild (every 6h, see `.github/workflows/deploy.yml`) keeps it current. Read-only in the UI — not user-editable. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation. Best-effort — doesn't account for the ~10:00 CET server-save rollover — always overridable. |
| 12 specific World Changes (Hive Born, Horestis, Deeplings, Sea Serpent, Demon War, Twisted Waters, Awash, Steamship, Overhunting, The Mage's Tower, Their Master's Voice, Thornfire) | Guide NPC chat log, pasted by the user, parsed against [documented verbatim reply text](lib/parser/guideMessages.ts) | Read-only in the grid — populated only via the import panel. |
| The rest of the World Changes (Swamp Fever, Horse Station, Insectoid Invasion), all Mini World Changes, Yasir's location, boosted region | Manual, local | No reliable public API or consistently-worded source covers these. The import panel can still auto-fill many Mini World Changes from pasted board text; both grids stay directly editable regardless. |

## Architecture

```
app/
  layout.tsx           — root shell, theme tokens
  page.tsx             — async Server Component: fetches events/Drome at build time,
                          passes them into the client dashboard as props
  globals.css
components/
  ui/            — hand-written shadcn-style primitives (Radix UI + CVA)
  dashboard/     — WorldSelector, DailyHeader, ImportGameTextCard, BoostedCard,
                   MiniWorldChangeGrid, WorldChangeGrid, MerchantCard, MarketPriceCard,
                   WarzoneScheduleCard, DromeCard, EventCard, BriefingPreview,
                   CopyButton, ToolbarActions, …
hooks/
  useBriefingState.ts   — the single orchestrating hook: live client queries + build-time
                           event/Drome props + persisted overrides + derived briefing text
  useCopyToClipboard.ts, useIsClient.ts
lib/
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
                   (PT/EN/ES/PL section labels), unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — seed data for every manual field, plus mergeOverridesWithDefaults
                   for safely loading an older localStorage save
  utils/         — cn, date/timezone/time-ago helpers, price-trend calculator
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

- Most Mini World Changes and 3 World Changes (Swamp Fever, Horse Station, Insectoid
  Invasion), plus Yasir's location and boosted region, are manual by design — there is no
  reliable public API for them and no publicly documented Guide NPC reply text to parse
  (12 other World Changes are covered by the Guide NPC parser instead, see the data
  source table above).
- The upcoming-events section of the generated briefing only reaches as far as the
  selected day window (5/7/14 days) — further-out events still show on the dashboard's
  own Upcoming events card, just not in the generated text.
- Rashid's location default is a fixed weekday rotation; it can be briefly wrong right
  around the ~10:00 CET server-save boundary.
- Timezone conversion for the warzone schedule compares UTC offsets for a single
  reference date rather than doing full calendar-aware conversion — it can be off by a
  day boundary or mid-window DST transition in rare edge cases.
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
  [`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts).
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

To add a new language, add an entry to `translations.ts`'s `TRANSLATIONS` map and to
`BRIEFING_LANGUAGES`. To change wording, section order, or add a new section, edit the
relevant `render*` function; to change what data feeds a section, edit
`buildBriefingModel`. All of this is covered by `lib/formatter/generateBriefing.test.ts`.

## License

MIT — see [LICENSE](LICENSE).
