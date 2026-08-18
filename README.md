# Morning Tibia

A daily Tibia world briefing generator. Pick a world, review (or correct) today's
conditions, and generate a polished, WhatsApp/Discord/Telegram-ready Portuguese bulletin
— in under a minute.

**Live at [nesleykent.github.io/morning-tibia](https://nesleykent.github.io/morning-tibia/).**

Morning Tibia is inspired by the workflow of Tibiopedia's *Mini World Changes* tool, but
is an original implementation: original visual design, original code, and original
branding. It does not scrape or reuse Tibiopedia's UI, parsing logic, or assets.

## What it does

1. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), boosted region, today's
   warzone schedule, live Tibia Drome rotation, and live official Active/Upcoming events.
2. **Mini World Changes** — the same category of daily/rotating world state Tibiopedia's
   tool tracks (Fury Gate, Hive stage, Roshamuul, Dream Courts arena boss, Bibby's
   Bloodbath, Horestis jars, Deeplings, Sea Serpent, Spirit Gate, Overhunting, and more)
   with clear status controls: Active / Inactive / Stage 1–3 / Location / Creature / Boss
   / Unknown. A dedicated **Import from game text** panel — front and center on the
   dashboard, not hidden behind a button — recreates Tibiopedia's paste-and-parse
   workflow with original code: paste the World Board's server log or a Guide NPC chat
   log and it auto-fills every field it can confidently recognize. The **9 items with an
   exact, documented Guide NPC reply for every state** (Hive, Horestis, Deeplings, Sea
   Serpent, Demon War, Twisted Waters, Awash, Steamship, Overhunting) are populated
   *only* that way and shown read-only in the grid; everything else has no such source
   and stays directly editable. See [lib/parser](lib/parser).
3. **Merchants & market** — Yasir and Rashid's location (Rashid defaults to the known
   weekday rotation, always editable), Tibia Coin buy/sell (live), Gold Token and Silver
   Token prices, with automatic up/down/unchanged trend indicators.
4. **Briefing generator** — turns all of the above into a formatted Portuguese daily
   message (rich WhatsApp-style with `*bold*` and emoji, or a plain-text variant), with
   one-click Copy, Copy plain text, Share (native share sheet with a clipboard fallback),
   Reset, and Refresh.
5. **Editing workflow** — every editable field is inline-editable; manual corrections are
   saved per world/day in `localStorage` so a recurring user can update quickly without
   re-entering everything.

## Data sources

Morning Tibia treats "no reliable public source" as an expected state, not an error — the
app never blocks on a missing data source; fields with no live source ship with sensible
defaults and stay manually editable.

| Data | Source | Notes |
|---|---|---|
| World list, PvP type, BattlEye, transfer type, online count, boosted creature/boss | [TibiaData API v4](https://docs.tibiadata.com/) | Public, no auth, CORS-open — fetched directly from the browser (`lib/data/worldProvider.ts`). |
| Warzone schedule, warzone health, Tibia Coin buy/sell | [nesleykent/tibia-warzones-schedule](https://nesleykent.github.io/tibia-warzones-schedule/) (published `data/worlds.json`) | Also CORS-open, fetched directly from the browser. Gold Token / Silver Token are listed as tracked items in that source but are never populated for any world today, so those two stay manual. |
| Active events, upcoming events, Tibia Drome rotation | [TibiaWiki](https://tibia.fandom.com/) gadget pages (`Active_Events`, `Upcoming_Events`, `Tibiadrome/Rotation`) — community-maintained live mirrors of tibia.com's own event calendar (which sits behind a Cloudflare bot check and can't be fetched directly) and Tibiadrome's documented fixed bi-weekly rotation | Fetched **at build time** via the MediaWiki API (`lib/data/wikiContentClient.ts`), since that API doesn't send CORS headers and can only be called server-side. A scheduled GitHub Actions rebuild (every 6h, see `.github/workflows/deploy.yml`) keeps it current. Read-only in the UI — not user-editable. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation. Best-effort — doesn't account for the ~10:00 CET server-save rollover — always overridable. |
| 9 specific Mini World Changes (Hive, Horestis, Deeplings, Sea Serpent, Demon War, Twisted Waters, Awash, Steamship, Overhunting) | Guide NPC chat log, pasted by the user, parsed against [documented verbatim reply text](lib/parser/guideMessages.ts) | Read-only in the grid — populated only via the import panel. |
| The rest of the Mini World Changes, Yasir's location, boosted region | Manual, local | No reliable public API or consistently-worded source covers these. The World Board import panel can still auto-fill many of them from pasted board text; the grid stays directly editable regardless. |

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
                   MiniWorldChangeGrid, MerchantCard, MarketPriceCard,
                   WarzoneScheduleCard, DromeCard, EventCard, BriefingPreview,
                   CopyButton, ToolbarActions, …
hooks/
  useBriefingState.ts   — the single orchestrating hook: live client queries + build-time
                           event/Drome props + persisted overrides + derived briefing text
  useCopyToClipboard.ts, useIsClient.ts
lib/
  data/          — worldProvider.ts (client hooks fetching TibiaData + tibia-warzones-
                   schedule directly — both are CORS-open, so this works from a static,
                   server-less deploy), tibiaDataMapping.ts (pure, unit tested),
                   wikiContentClient.ts (build-time-only TibiaWiki fetcher, unit tested)
  parser/        — boardMessages.ts / guideMessages.ts (verbatim catalogs) +
                   parseBoardLog.ts / parseGuideLog.ts, all unit tested
  formatter/     — generateBriefing.ts (pure, no React import), unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — seed data for every manual field
  utils/         — cn, date helpers, price-trend calculator
types/           — one file per domain concept (World, MiniWorldChange, Merchant, …)
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
npm test            # Vitest — formatter, parsers, Rashid rotation, data mapping, etc.
```

## Current limitations

- Most Mini World Changes, Yasir's location, and boosted region are manual by design —
  there is no reliable public API for them (9 specific ones are covered by the Guide NPC
  parser instead, see the data source table above).
- Rashid's location default is a fixed weekday rotation; it can be briefly wrong right
  around the ~10:00 CET server-save boundary.
- Gold Token and Silver Token prices have no live source today and are always manual.
- Active events, upcoming events, and the Tibia Drome rotation are as fresh as the last
  deploy (scheduled every 6 hours), not truly real-time — there's no server to poll them
  live from a static GitHub Pages site.
- Persistence is `localStorage`-only — overrides are per browser/device, not synced
  across devices or shared with a guild.

## How to add a new Mini World Change

Add one entry to `MINI_WORLD_CHANGE_DEFINITIONS` in
[`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts):

```ts
{
  id: "unique-id",
  label: "Display Name",
  shortLabel: "Short Name",
  emoji: "✨",
  category: "rotation", // gate | hive | arena | rotation | hunt | seasonal
  controlType: "toggle", // toggle | stage | location | creature | boss
  source: "manual", // "guide-npc" only if lib/parser/guideMessages.ts has exact reply text for it
  description: "One line describing what this tracks.",
}
```

`createDefaultMiniWorldChangeValues()` and the grid UI pick it up automatically — no
other file needs to change. `controlType` determines which inline editor renders
(`StatusSelector`, `StageSelector`, or a text input with suggestions); `source` decides
whether it's directly editable or populated only via the Guide NPC import panel. Both
feed into how it's formatted in the generated briefing (see
`lib/formatter/briefingModel.ts`).

## How to change the generated briefing format

The formatter is intentionally isolated from React:

- [`lib/formatter/briefingModel.ts`](lib/formatter/briefingModel.ts) turns raw app state
  into a flat, render-agnostic `BriefingModel`.
- [`lib/formatter/generateBriefing.ts`](lib/formatter/generateBriefing.ts) renders that
  model two ways — `renderRichBriefing` (WhatsApp-style, `*bold*` + emoji) and
  `renderPlainBriefing` (no markdown, no emoji) — and exports
  `generateBriefingMessage` / `generatePlainTextBriefing` as the public API.

To change wording, section order, or add a new section, edit the relevant `render*`
function; to change what data feeds a section, edit `buildBriefingModel`. Both are
covered by `lib/formatter/generateBriefing.test.ts`.

## License

MIT — see [LICENSE](LICENSE).
