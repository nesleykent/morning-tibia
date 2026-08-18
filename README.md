# Morning Tibia

A daily Tibia world briefing generator. Pick a world, review (or correct) today's
conditions, and generate a polished, WhatsApp/Discord/Telegram-ready Portuguese bulletin
— in under a minute.

Morning Tibia is inspired by the workflow of Tibiopedia's *Mini World Changes* tool, but
is an original implementation: original visual design, original code, and original
branding. It does not scrape or reuse Tibiopedia's UI, parsing logic, or assets.

## What it does

1. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), boosted region, Tibia Drome
   status, and today's warzone schedule.
2. **Mini World Changes** — the same category of daily/rotating world state Tibiopedia's
   tool tracks (Fury Gate, Hive stage, Roshamuul, Dream Courts arena boss, Bibby's
   Bloodbath, Horestis jars, Deeplings, Sea Serpent, Spirit Gate, Overhunting creature,
   and more) with clear status controls: Active / Inactive / Stage 1–3 / Location /
   Creature / Boss / Unknown.
3. **Merchants & market** — Yasir and Rashid's location (Rashid defaults to the known
   weekday rotation, always editable), Tibia Coin buy/sell (live where available), Gold
   Token and Silver Token prices, with automatic up/down/unchanged trend indicators.
4. **Briefing generator** — turns all of the above into a formatted Portuguese daily
   message (rich WhatsApp-style with `*bold*` and emoji, or a plain-text variant), with
   one-click Copy, Copy plain text, Share (native share sheet with a clipboard fallback),
   Reset, and Refresh.
5. **Editing workflow** — every field is inline-editable; manual corrections are saved
   per world/day in `localStorage` so a recurring user can update quickly without
   re-entering everything.

## Data sources

Morning Tibia treats "no reliable public source" as an expected state, not an error — the
app never blocks on a missing data source; fields with no live source ship with sensible
defaults and stay manually editable (spec §11).

| Data | Source | Notes |
|---|---|---|
| World list, PvP type, BattlEye, transfer type, online count | [TibiaData API v4](https://docs.tibiadata.com/) | Public, no auth. Proxied through `app/api/tibia/*` route handlers (cached, `revalidate: 300`). |
| Boosted creature / boosted boss | TibiaData API v4 (`/boostablebosses`, `/creatures`) | Proxied through `app/api/tibia/boosted`, `revalidate: 600`. |
| Warzone schedule, warzone health, Tibia Coin buy/sell | [nesleykent/tibia-warzones-schedule](https://nesleykent.github.io/tibia-warzones-schedule/) (published `data/worlds.json`) | Proxied through `app/api/warzones`, `revalidate: 600`. Gold Token / Silver Token are listed as tracked items in that source but are never populated for any world today, so those two stay manual. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation. Best-effort — doesn't account for the ~10:00 CET server-save rollover — always overridable. |
| Mini World Changes, Yasir's location, active/upcoming events, Tibia Drome status, boosted region | Manual, local | Tibia exposes none of these through any public API. The reference tool reads them off in-game board text pasted by the user; Morning Tibia instead gives every field a direct, inline editor with a persisted default. |

## Architecture

```
app/
  layout.tsx, page.tsx, globals.css   — root shell, theme tokens
  api/tibia/worlds/route.ts           — GET  → World[]
  api/tibia/world/[name]/route.ts     — GET  → WorldDetail
  api/tibia/boosted/route.ts          — GET  → { creature, boss }
  api/warzones/route.ts               — GET ?world= → WarzoneSchedule
components/
  ui/            — hand-written shadcn-style primitives (Radix UI + CVA)
  dashboard/     — WorldSelector, DailyHeader, BoostedCard, MiniWorldChangeGrid,
                   MerchantCard, MarketPriceCard, WarzoneScheduleCard, DromeCard,
                   EventCard, BriefingPreview, CopyButton, ToolbarActions, …
hooks/
  useBriefingState.ts   — the single orchestrating hook: live queries + persisted
                           overrides + derived briefing text + every mutation
  useCopyToClipboard.ts, useIsClient.ts
lib/
  data/          — tibiaDataClient.ts / warzoneScheduleClient.ts (server-only fetchers),
                   worldProvider.ts (client hooks over our own API routes)
  formatter/     — generateBriefing.ts (pure, no React import), unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — seed data for every manual field
  utils/         — cn, date helpers, price-trend calculator
types/           — one file per domain concept (World, MiniWorldChange, Merchant, …)
```

Data fetching is separated from UI: components never call `fetch` directly, only the
hooks in `lib/data` and `hooks/useBriefingState.ts` do, against our own route handlers —
so a data source can be replaced by editing one file. Persistence is behind the
`BriefingRepository` interface (`lib/storage/briefingRepository.ts`); swapping
`localStorage` for a real backend later means implementing that interface once.

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
npm run build
npm run start
```

## Other scripts

```bash
npm run lint        # ESLint (flat config, next/core-web-vitals + next/typescript)
npm run typecheck   # tsc --noEmit
npm test            # Vitest — formatter, Rashid rotation, price-trend logic
```

## Current limitations

- Mini World Changes, Yasir's location, active/upcoming events, and Tibia Drome status
  are manual by design — there is no reliable public API for them.
- Rashid's location default is a fixed weekday rotation; it can be briefly wrong right
  around the ~10:00 CET server-save boundary.
- Gold Token and Silver Token prices have no live source today (see the data source table
  above) and are always manual.
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
  description: "One line describing what this tracks.",
}
```

`createDefaultMiniWorldChangeValues()` and the grid UI pick it up automatically — no
other file needs to change. The `controlType` determines which inline editor renders
(`StatusSelector`, `StageSelector`, or a text input with suggestions) and how it's
formatted in the generated briefing (see `lib/formatter/briefingModel.ts`).

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
