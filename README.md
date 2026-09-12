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
2. **A page ordered by the morning, not by the data model** — the screen follows the actual
   task: *today's conditions → import what the game told you → settle the few things only you
   can settle → see what today makes possible → review and share the briefing → the full
   catalog as reference.* The briefing sits **above** the catalog rather than beneath 40
   status rows, the import box collapses to one line once it has done its job, and the
   sections for unresolved work and opportunities render nothing at all when they're empty.
   Mini World Changes and World Changes are grouped by what the player actually knows
   (running / needs you / can't be checked / not running / not checked), so the group heading
   carries the state once instead of every row repeating a "Not checked" pill.

3. **Daily world overview** — date, selected world, live PvP/BattlEye/transfer/online
   status, boosted creature & boss (with official artwork), one or more boosted regions
   (multi-select, picked from a curated list of real Tibia locations — not free text),
   today's warzone schedule (each execution shown as `12:00 (1-2-3)`, already converted
   to your timezone), and a unified **Events** card mixing active and upcoming events
   (active ones flagged with a badge) with a 5/7/14-day window control for how far ahead
   it reaches. The Tibia Drome rotation itself lives in the top status bar's countdown,
   not as a separate card.
4. **Two distinct Tibia mechanics, tracked separately** — Mini World Changes and World
   Changes are different systems with different in-game sources, so they get separate
   sections and separate data models — never merged. Everything below was verified entry by
   entry against TibiaWiki's ["Mini World Changes"](https://tibia.fandom.com/wiki/Mini_World_Changes),
   ["The World Board"](https://tibia.fandom.com/wiki/The_World_Board),
   ["Towncryer"](https://tibia.fandom.com/wiki/Towncryer) and
   ["World Changes"](https://tibia.fandom.com/wiki/World_Changes) articles plus each
   change's own page, and cross-checked against live Guide NPC transcripts.

   **Mini World Changes** — 26 are modelled; *Oriental Trader* is Yasir's merchant card (see
   below) rather than a duplicate. Two sources *announce* them, and they are modelled
   separately because they carry different amounts of information:

   - **The World Board** (Adventurer's Guild floor +1, near Charos) prints one line per
     *currently active* change. Being an exhaustive listing, a **complete** reading is the
     only evidence in the whole app that can prove a negative.
   - **The Towncryer** (Thais, around the depot and docks) shouts one change at a time. It
     can never prove a negative — but for **Jungle Camp** it is the only in-game way to
     learn which side is winning, since the board's single line names neither.

   **Three changes are announced by neither**, and treating them as though they were would
   be the app's worst possible bug: a complete board reading would appear to prove they are
   not running, when the board could never have mentioned them. TibiaWiki BR (more current
   than the English wiki here) documents them explicitly:

   | Change | Detection | How you actually find out |
   |---|---|---|
   | Beaver Breakout | `silent` | Go to Silvertides in Marapur and see whether the Giant Beavers are out of their pen. |
   | Shipwrecked | `silent` | Look at Krailos' north coast — or, with Krailos revealed by the Measuring Tibia Quest, check the map for active pirate respawns on the steppe. |
   | Forsaken | `always-active` | It never stops; the Forsaken Mine just rotates between four creature sets each server save. Look down from the first floor before descending. |

   Each Mini World Change therefore carries a `detection` field, and only `announced` ones
   can ever be inferred inactive — enforced in `parseGameText` and covered by regression
   tests. The UI gives the silent ones their own group with their own wording and an
   explicit "I saw it / not today" control, rather than pretending a paste could settle them.

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
   | *(silent)* | Not "unchecked" in the same sense — **no** paste will ever settle it. | Beaver Breakout, Shipwrecked |
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

5. **Today's opportunities** — Morning Tibia doesn't just report the world state, it says
   what that state makes possible before it disappears. The model that matters is
   **change → state → opportunity**, not change → opportunity: Overhunting offers White Deer
   kills and the Kingly Deer mount in its deer states, and *none of that* in the starving-wolf
   state, where it offers the Starving Wolf bestiary entry and the Magic Wolf Traps instead.
   A catalog keyed only on the change would be wrong half the time.

   Opportunities are not only achievements. [`lib/defaults/opportunities.ts`](lib/defaults/opportunities.ts)
   covers bestiary entries and Charm Points, bosses, mounts and taming, quests and quest
   missions, items, access, NPC services, hunting grounds and World Change progress. The most
   valuable thing on some days isn't an achievement at all — Their Master's Voice puts three
   Very Rare bestiary entries in reach that complete at 5 kills each for 130 Charm Points
   between them.

   Every entry is researched and sourced, never inferred from a shared theme or location: a
   TibiaWiki spoiler naming the enabling change, a creature page stating the creature only
   exists under that condition, or a mount's own `taming_method`. Bestiary kill counts and
   Charm Points are *derived* from the creature's published difficulty and occurrence via
   [`lib/defaults/bestiary.ts`](lib/defaults/bestiary.ts), so they cannot be mistyped.

   Facts and opinions are kept in different fields. `detail` and `caveat` are things the game
   does; community judgement — a recommended level, "the best respawn in the game" — lives in
   `advisory` and renders behind a "Tip:" marker, so a reader can always tell which half of a
   line CipSoft actually guarantees. A test enforces the split.

   Each entry carries an **availability**, which is what stops the section overselling:
   *available today*, *progressable today* (real progress now, finishing needs more days), or
   *unlocks a future state* (today changes what exists after the next server save). The Raging
   Mage is standing at his tower whenever the portal is open and still cannot be fought until
   the world has killed 2000 Yielothaxes — so he is progressable, never available.

   An opportunity is only ever derived from a condition the app has actually *established*.
   Unchecked produces nothing, and neither does "not running", so a fresh session shows no
   opportunities at all. In the bulletin a fresh session still renders the Mini World Changes
   section, because the three changes no source announces are in it every day — but their
   blocks are a name, a place and a sentence saying nobody has looked, with nothing to act on
   under them.

6. **Merchants & market** — Yasir travels between exactly 3 cities (Carlin, Liberty Bay,
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
   better than the data itself, so a manual override could only ever be wrong. They come
   straight from [TibiaMarket](https://www.tibiamarket.top)'s own API
   ([`api.tibiamarket.top`](https://api.tibiamarket.top/docs)), whose `/item_history`
   endpoint answers with real day-by-day history (daily `day_average_sell`/
   `day_average_buy` entries) rather than the single current tick a "market values" call
   would give — so every price has meaningful history from the very first load. That API
   rate-limits by address and has no endpoint returning several items at once, so the three
   items are fetched one after another and **each is shown the moment it arrives**: Tibia
   Coin within a second, the tokens over the next few. A basis selector on the dashboard (Last entry / Avg 3 / Avg 7 / Avg 14 entries,
   `lib/utils/priceTrend.ts`) controls both the shown gp figure and the up/down/unchanged
   trend arrow: the trend compares that basis's average including the latest entry against
   the same basis computed one entry earlier, so "Avg 7" reflects whether the 7-entry (day)
   average actually moved, not just whether the single newest tick did. An "as of X ago"
   snapshot-freshness label (next to an **auto** badge meaning "sourced automatically", not
   literally "this second" — the feed itself gains an entry about once a day) also appears in
   the generated briefing text next to the price, which itself reflects the same selected
   basis.
7. **Briefing generator** — turns all of the above into a formatted daily message (rich
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
8. **Editing workflow** — every editable field is inline-editable; manual corrections are
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
| Tibia Coin, Gold Token, Silver Token sell/buy offers | [TibiaMarket](https://www.tibiamarket.top) — [`api.tibiamarket.top/item_history`](https://api.tibiamarket.top/docs), one call per item per world (item ids 22118 / 22721 / 22516) | No token, CORS-open, fetched straight from the browser (`lib/data/tibiaMarketClient.ts` + `marketHistoryMapping.ts` + `worldProvider.ts`), re-fetched every 15 minutes while the dashboard is open and cached per world for the session. Fully read-only — no manual override. Real day-by-day history (90 days of `day_average_sell`/`day_average_buy` entries, one per day) rather than a single current-tick snapshot, so the trend/average basis selector has genuine data from the first load. The API rate-limits by address, so requests are queued one at a time with a gap between them, refusals are backed off and retried, and each item is published to the page as it lands instead of the panel waiting on the slowest. Mapping is literal — our `*Sell`/`*Buy` price ids hold exactly that field, with no reinterpretation into a "what the player pays/receives" framing (see `hooks/useBriefingState.ts`). |
| Active events, upcoming events, Tibia Drome rotation | [TibiaWiki](https://tibia.fandom.com/) gadget pages (`Active_Events`, `Upcoming_Events`, `Tibiadrome/Rotation`) — community-maintained live mirrors of tibia.com's own event calendar (which sits behind a Cloudflare bot check and can't be fetched directly) and Tibiadrome's documented fixed bi-weekly rotation | Fetched **at build time** via the MediaWiki API (`lib/data/wikiContentClient.ts`), since that API doesn't send CORS headers and can only be called server-side. A scheduled GitHub Actions rebuild (every 6h, see `.github/workflows/deploy.yml`) keeps it current. Read-only in the UI — not user-editable. |
| Rashid's location | Computed locally (`lib/rashid/rashidRotation.ts`) | Fixed, publicly documented weekday rotation, resolved against Europe/Berlin time and rolled over at the 10:00 CET/CEST server save (not local midnight) — DST-safe. Shown read-only in the UI; there's no known case where it needs correcting. |
| All 14 World Changes | Guide NPC chat log, pasted by the user, parsed against [verbatim reply text](lib/parser/guideMessages.ts) | One keyword per change (`guideKeyword`), shown on the card. A reply establishes one documented state, matched as a *prefix* so a live reply that continues past the transcript still resolves; silence about a keyword only ever means "not asked". A line that is unmistakably a Guide speaking but whose wording isn't in the catalog is reported as unread rather than dropped. Each card also has a picker limited to that change's documented states, for a player who read the reply but didn't copy it. |
| The 23 Mini World Changes | World Board server log **and/or** Towncryer shouts, parsed against [board text](lib/parser/boardMessages.ts) and [Towncryer text](lib/parser/towncryerMessages.ts) | A recognised line proves the change is running, plus its variant where the wording names one. A board reading also records unmentioned changes as not running, because using the board writes its whole current listing to the Server Log in one action and the game offers no way to produce a partial one. A Guide log or a Towncryer shout never does: neither is a listing. See [`parseBoardLog.ts`](lib/parser/parseBoardLog.ts) and [`types/evidence.ts`](types/evidence.ts). |
| Which variant a running change has (7 of the 23) | Board/Towncryer wording where it names one; otherwise the player | Closed pick list of the real possibilities, enabled only once a source has confirmed the change is running — a picker can never manufacture activity. Fury Gates (10 cities), Nomads (4 camps) and Warpath (3 spots) are normally player-supplied, since no in-game source names them. |
| Yasir's location (3 possible cities) | The "Oriental Trader" message on the board, or the Towncryer's version of it | Trading with the city pending until one is picked — closed pick list, no free text. A complete board reading that omits it marks him confirmed not trading, rather than merely unverified. |
| The 3 Mini World Changes no source announces (Beaver Breakout, Shipwrecked, Forsaken) | The player, after looking in game | Never inferred from a paste in either direction. A complete board reading leaves them untouched, because the board has no line for them — see `detection` in [`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts). |
| Today's opportunities | Derived from confirmed **states** via [`lib/opportunities/deriveOpportunities.ts`](lib/opportunities/deriveOpportunities.ts) | Never from an unchecked or ruled-out condition, and never from a state that blocks the thing. Each entry is sourced in [`lib/defaults/opportunities.ts`](lib/defaults/opportunities.ts) and carries an availability tier; bestiary numbers are derived, not typed. Catalog drift is caught by tests. |
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
  data/          — worldProvider.ts (client hooks fetching TibiaData,
                   tibia-warzones-schedule and api.tibiamarket.top directly — all
                   CORS-open, so this works from a static, server-less deploy),
                   tibiaMarketClient.ts (the rate-limit-aware TibiaMarket caller: one
                   request at a time, spaced, retried on a refusal — unit tested),
                   tibiaDataMapping.ts (pure, unit tested), marketHistoryMapping.ts (pure,
                   unit tested — turns /item_history rows into price snapshots),
                   wikiContentClient.ts (build-time-only TibiaWiki fetcher, unit tested)
  parser/        — boardMessages.ts / towncryerMessages.ts / guideMessages.ts (verbatim
                   catalogs, one per in-game source) + parseBoardLog.ts (which alone can
                   report a complete reading, from the board's own messages) /
                   parseTowncryerLog.ts / parseGuideLog.ts (positives only), combined into
                   parseGameText.ts so one paste is checked against all three at once and
                   only the board can ever conclude something is not running — all unit
                   tested
  opportunities/ — deriveOpportunities.ts (turns confirmed *states* into what today makes
                   possible; returns nothing from unchecked state, by design)
  dashboard/     — dailyDigest.ts (groups raw state into what's running / needs you /
                   can't be checked / ruled out, so the page can be laid out by meaning)
  formatter/     — generateBriefing.ts (pure, no React import) + translations.ts
                   (PT/EN/ES/PL section labels) + worldChangeNarratives.ts /
                   miniWorldChangeNarratives.ts (the per-state narrative text catalogs),
                   unit tested
  storage/       — BriefingRepository interface + LocalStorageBriefingRepository
  rashid/        — the weekday rotation calculator, unit tested
  defaults/      — the Mini World Change / World Change catalogs (names, locations,
                   variants, Guide keywords, documented states), opportunities.ts (the
                   researched state → opportunity catalog) + bestiary.ts (TibiaWiki's own
                   kills/Charm Points table, so those numbers are derived not typed),
                   tibiaLocations.ts (the curated location list used for boosted
                   region), plus
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
tibia-warzones-schedule, api.tibiamarket.top) is; everything that can only be fetched
server-side due to CORS
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
- Beaver Breakout and Shipwrecked can only ever be settled by going to look; Forsaken's
  daily creature rotation likewise. That is the game, not a gap in the app — but it does mean
  those three never resolve from a paste alone.
- Opportunities cover the relationships that survive a documented-source check, in whatever
  form they take — bestiary, boss, mount, quest, item, access, service, hunt or World Change
  progress. Where research found nothing verifiable for a state, that state produces nothing
  rather than a padded list.
- The briefing caps each change at seven opportunities, plus its deadline-bound "do this
  before the next server save" line, which is admitted on top of the cap. The cap is per change
  rather than global, so a busy hive cannot crowd out a quiet lake and no arbitrator has to
  decide between them. The full list is on the catalog view.
- The upcoming-events section of the generated briefing only reaches as far as the
  selected day window (5/7/14 days) — further-out events still show on the dashboard's
  own Upcoming events card, just not in the generated text.
- Every one of the 14 World Changes now auto-detects in every documented state: a sweep of
  fourteen worlds' live Guide logs closed the last gap, Swamp Fever, whose middle and outbreak
  wordings had never been transcribed publicly. `guideWordingUnknown` in
  [`lib/defaults/worldChanges.ts`](lib/defaults/worldChanges.ts) still exists for the next such
  gap, and a test asserts that no state uses it today, so one appearing is a decision somebody
  makes on purpose. A few replies (Horse Station's "working normally", and the
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
pick new entries up automatically — no other file needs to change. `quiet` marks the
uneventful end of a cycle for ordering and grouping; it does **not** hide anything. Every
World Change state a Guide actually reported is printed in the briefing, because the section
is a report of today's world state and a quiet answer is still an answer.

## How to change the generated bulletin

The bulletin is what the reader takes away — a message pasted into WhatsApp or Discord — so
its shape is driven by that destination rather than by the app's own structure.

**One entry per change, state and opportunities together.** The two used to be separate
sections, which meant a reader met "Overhunting: starving wolves" near the top and
"Overhunting / Starving Wolf — Bestiary" forty lines below, and had to hold the first in
their head until the second arrived. Merged, each change is named once and every fact
appears once: a full day went from 165 lines to about 90.

**Opportunities that only restate the change are dropped.** An access route and an NPC service
are what the state sentence above already says. The concrete kinds (bestiary, boss, mount,
achievement, outfit, quest, item, World Change progress, state transition) name something
separable, so they get a line of their own.

**Every subordinate line declares its own kind with a glyph**, so a reader scanning for "what
can I actually do today" finds it without reading a word of connective tissue: 🎯 a Bestiary
creature, 👹 a boss, 🐎 a mount, 👕 an outfit, 🏆 an achievement, 🔄 something to go and do,
⚔️ what is spawning, 💡 somebody's advice, ⏳ what changes at the next server save. A Bosstiary
boss is never printed as 🎯: they are different game systems with different rewards, and 🎯
carries a kill count and a Charm Points payout that a boss does not have. An achievement always
reads `Name: requirement; N achievement point(s)` with the achievement's *own* name in front —
never the boss or mount it rides along with, which is how "Groam: achievement Eye of the Deep"
used to reach a guild channel.

**How many lines a change gets is decided by the state it is in.** The cap used to be a flat
two, which is right for a lake that is merely clean and wrong for a fallen hive, where six Bane
bosses, a mount that exists nowhere else, an outfit room and two War Exp achievements open at
once. The catalog is curated per *state*, so a state contributes what it actually offers, up to
a ceiling of nine, plus any deadline-bound line, which is admitted on top of the cap because it
is the only tier that is worthless read tomorrow. Quiet states still produce one or two lines,
because that is all they have, and only the fallen hive reaches the ceiling.

**Creatures that share a bestiary profile share a line.** A bestiary line is a name and two
numbers, so seven Horestis Tomb creatures that all complete at 1,000 kills for 25 Charm Points
print the same two numbers seven times. The renderer groups them, and the rule is the renderer's
rather than the author's: every change gets it, which is why the three ordinary Horses, the two
Nomads and the Diamond and Golden Servants now share lines too. Grouping is on an exact match of
kills *and* Charm Points within one change, never across changes, and a creature keeps its own
line whenever something else needs to point at it by name: an achievement, a per-creature
qualifier, an advisory, a place in a chain, or a mount that tames it. Phantasm is Hard where the
rest of its Spirit Ground is Medium and gets its own line for that reason; Ladybug keeps one
because the Lady Bug mount names it.

**Markers for the two halves of a taming.** 🍀 is the item that tames something (a Four-Leaf
Clover, a Slug Drug) and 🐎 is the mount it earns. They used to share the errand marker, which
said the wrong thing about both.

**A step sorts in front of what it feeds.** A Gooey Mass gives a Four-Leaf Clover and the clover
tames the Ladybug. The mount outranks the clover on every ordering key, which had the bulletin
telling a reader to use an item two lines before it said where one comes from; `leadsTo` places
the step directly ahead of its target, after the comparator has run rather than inside it.

**Some changes have two unknowns, not one.** TibiaWiki says outright that the Spirit Grounds'
"3 portals and 3 hunting grounds... do not correspond", so knowing the gate is in Ghostlands
says nothing about whether Ghouls or Phantasms are behind it. The board and the Towncryer name
the gate, and nothing names the ground, so the definition carries a second closed set
(`contents`) alongside `variants` and the page asks for both. One slot would have had to throw
one of the two facts away.

**An unchecked selectable state names its options.** Fury Gates, the Nomad camps, Trapwood's
two factions, the Spirit Grounds' three hunting grounds and the rest are closed sets that no
in-game source announces; somebody has to go and look. The bulletin used to say "which one isn't known yet", which tells the reader the
answer is out of reach. It now says *We haven't checked which Fury Gate is active yet. It can be
near one of these cities: …*, with the list built from the same catalog the picker is built
from, so adding a city to the catalog adds it to the sentence the same day.

**The three changes nothing announces are in the section every day.** Beaver Breakout,
Shipwrecked and Forsaken are never reported by the World Board or the Towncryer, so no paste
can rule them out and their absence from the bulletin would be silence a reader cannot read:
"nobody has been to Krailos" and "the coast is clear" would look identical. They get a block
whether or not anybody has looked, and on a day nobody has, the sentence says so and names
what the answer could be — *We haven't checked Krailos' north coast yet. Nothing announces this
change: there may be a wreck with pirates on the steppe, or the coast may be clear.* This is
the one exception to "unchecked produces nothing", and it exists for the same reason the rule
does: an unasked question must not read as an answer, in either direction. The twenty
*announced* changes keep the rule unchanged — for them absence **is** the answer, because the
board would have said so. Forsaken is never "off", so for it "nobody has looked" and "running,
nobody said which rotation" are one sentence, not two. See `isUnannounced` in
[`lib/defaults/miniWorldChanges.ts`](lib/defaults/miniWorldChanges.ts).

**Server-save causality is spelled out, in that order.** An action today, the next server save,
then the result: "Once 1,000 corpses have been thrown in server-wide, the lake will become dirty
after the next server save." Changes that advance *immediately* say so instead, which is the
whole point of the Fire-Feathered Serpent's mechanic.

**No bullet glyphs, middle dots or em dashes, anywhere the reader looks.** They are how
generated text gives itself away, and the bulletin is forwarded to people who did not generate
it. An opportunity reads `Nomad (Blue): 500 kills, 15 Charm Points`, a change reads
`Fire from the Earth: the volcano is erupting`, and a qualifier that would make a comma list
ambiguous goes in parentheses. Enforced by tests over both the bulletin and the catalogs.

**A semicolon parts a clause from what it is worth; a comma stays inside each half.** A line
that opens with a list and closes with what that list costs has two halves, and both may carry
commas of their own: `Bestiary: Kollos, Spidris and Spidris Elite; 1,000 kills, 25 Charm Points
each`, `Chest Robber: Loot the chest of 3 different Nomad camps; 1 achievement point`. Without
the semicolon "Spidris Elite" read as the item before "1,000 kills". A line that opens *with*
the figures has no clause to part and keeps its comma: `Yielothax: 1,000 kills, 25 Charm
Points`. The same rule governs the place on a change's own name — independent places are parted
(`Horse Station _(Thais; Venore)_`) and a place whose own name carries a comma is not
(`Twisted Waters _(Lake Equivocolao, Port Hope)_`). Which of the two a location is cannot be
recovered from a joined string, so the catalogs declare it by listing each place separately in
`briefingLocations`.

**Markup is the intersection of the two clients.** `*bold*` is WhatsApp's; Discord reads it
as italic, which is a graceful degradation. Discord's `**bold**` arrives in WhatsApp as
literal asterisks, so it is never used. Leading whitespace is collapsed in chat clients, so an
opportunity line carries no prefix at all; the change's own line is the one with the emoji and
the bold name. Names keep their own casing, since upper-casing them shouted and mangled the
official Tibia names the app is otherwise careful to reproduce exactly.

The formatter is isolated from React:

- [`lib/formatter/translations.ts`](lib/formatter/translations.ts) holds every word the
  bulletin says in its own voice, in PT/EN/ES/PL. Labels are sentence case; official Tibia
  terms ("Charm Points", "boss", "World Change") stay in English, because that is what a
  Brazilian player says.
- [`lib/formatter/briefingModel.ts`](lib/formatter/briefingModel.ts) turns raw app state
  into a flat, render-agnostic `BriefingModel` whose `ChangeLine` carries a change's state
  *and* its opportunities.
- [`lib/formatter/opportunityPhrases.ts`](lib/formatter/opportunityPhrases.ts) composes an
  opportunity's one-line form from the structured catalog entry — never from prose.
- [`lib/formatter/generateBriefing.ts`](lib/formatter/generateBriefing.ts) is a **single**
  renderer parameterised by a two-field `Style` (emoji on/off, markup on/off), exported as
  `generateBriefingMessage` / `generatePlainTextBriefing`. It used to be two functions of
  ~150 near-identical lines, and they drifted into different section shapes; one renderer
  cannot.
- [`lib/formatter/worldChangeNarratives.ts`](lib/formatter/worldChangeNarratives.ts) holds
  the human-written headline/body per World Change and state, in all 4 languages. A state
  with no entry falls back to its catalog label rather than disappearing.
- [`lib/formatter/miniWorldChangeNarratives.ts`](lib/formatter/miniWorldChangeNarratives.ts)
  is the same idea for Mini World Changes — one sentence per variant, with each variant's
  name written out per language rather than interpolated from the English catalog label.
- [`lib/defaults/eventPreviews.ts`](lib/defaults/eventPreviews.ts) holds what each upcoming
  event is worth turning up for. NEXT EVENTS used to be a name, a date and a countdown, which
  answers "when" and leaves "why should I care" to the reader; each event now carries at most
  two preview lines. Where an event has something on a fixed day *inside* its window — Feroxa
  always spawns on the 13th, whatever day Grimvale opens — that day is rendered as a real date
  worked out from the occurrence's own start, so nobody edits a sentence every month.

Three test files guard this. [`generateBriefing.test.ts`](lib/formatter/generateBriefing.test.ts)
reads a handful of scenarios closely; [`briefingCoverage.test.ts`](lib/formatter/briefingCoverage.test.ts)
sweeps every state of every change in all four languages and both formats, asserting the
structural invariants a pasteable message has to hold — balanced markup, no indentation, no
doubled blank lines, no dangling separators, and a ceiling on length; and
[`stageAwareness.test.ts`](lib/formatter/stageAwareness.test.ts) holds the one rule the whole
catalog exists to keep — **a change may only offer what the stage it is actually in offers**.
It checks each stage twice, for what it must say and for the neighbouring stage's content that
must not leak into it, and then does the same structurally for every state of every change, so
a future catalog edit cannot widen a trigger by accident. It is also where the two things the
app must never invent are pinned down: no inferred "days left" for Hive Born, whose Guide reply
carries no day number, and no countdown on the Mage Tower's collapsing portal, whose kill has no
timestamp the app can read.

To add a new language, add an entry to `translations.ts`'s `TRANSLATIONS` map and to
`BRIEFING_LANGUAGES`. To change wording, section order, or add a new section, edit the
relevant `render*` function; to change what data feeds a section, edit
`buildBriefingModel`. All of this is covered by `lib/formatter/generateBriefing.test.ts`.

## License

MIT — see [LICENSE](LICENSE).
