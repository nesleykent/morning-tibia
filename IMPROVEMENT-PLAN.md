# Morning Tibia — Product Improvement Plan

**Reviewed:** 2026-09-10 · branch `claude/website-improvement-plan-71f8c3` (HEAD `a4c3025`, "Redesign: the dispatch replaces the dashboard")
**Method:** full source read + live browser session against `npm run dev`, including a fresh-`localStorage` load, a complete World Board paste, a simulated total API outage, mobile viewport, DOM accessibility inspection, and WCAG contrast maths on the palette.

## What this product is

Morning Tibia answers one question — *what changed in my Tibia world while I slept, and what does that make possible today?* — and produces a shareable bulletin for a guild chat. The domain model behind it is unusually rigorous: four knowledge states, a hard rule that only a complete World Board reading can prove a negative, three silent Mini World Changes that no paste can ever settle, and 26 researched achievement links that refuse to be padded. That rigour is the product's real asset.

The recent "dispatch" redesign converted that model into readable prose, which was the right call. But the redesign shipped without carrying two features across, left the onboarding path unreachable, and inherited a set of failure modes (no error state, a frozen clock, a Reset that lies about its scope) that matter more than usual here — because the output of this app is something a person **pastes into a guild channel as fact**.

Findings below are grouped by the sections you asked for. Every claim marked *verified* was observed in the running app, not inferred from code.

---

## Critical Issues

- [ ] **Make the first-run invitation actually reachable**

  **What:** Fix the `emptyInvitation` condition in `MorningTibiaDashboard.tsx` so a brand-new visitor sees an explanation of what the page is and what to do, and rewrite that copy into a real first-run block.

  **Where:** [MorningTibiaDashboard.tsx:182](components/dashboard/MorningTibiaDashboard.tsx:182) (`emptyInvitation={!hasEvidence && stanzas.length === 0}`) and the block that consumes it in [Dispatch.tsx:34](components/dispatch/Dispatch.tsx:34).

  **How it should work:** The gate must be `!hasEvidence` alone — not `stanzas.length === 0`. `composeDispatch` *always* emits stanzas on a fresh session (Forsaken is `always-active` so it produces a clause; Rashid is computed so he produces a clause; the two silent changes produce a stanza), so `stanzas.length === 0` is never true and the invitation is unreachable dead code. Once reachable, the block should render **above** the stanzas as a short lead paragraph in the dispatch's own serif voice, and disappear the moment `hasEvidence` becomes true. It should name the three sources concretely (World Board location, Guide NPC keyword mechanic, Towncryer location) and point at the paste field below, ideally with an anchor link that focuses the textarea.

  **Why:** *Verified* — with `localStorage.clear()` and a reload, the page shows a boosted pair, one gap-filled Forsaken sentence, Rashid's location and a "Nothing announces these" stanza, and **never** explains that the page is waiting for a paste. A first-time visitor sees a half-written document with no instructions and no clue that the textarea 800px down is the point of the whole app.

  **Example:** *"Nothing has been checked yet today. Read the world board at the Adventurer's Guild (floor +1, near Charos), ask any Guide about a world change, then paste what they told you into the box below — this page will write itself."* followed by a `Paste what the game told you →` link scrolling to and focusing the textarea.

  **Impact:** Turns a confusing first visit into a guided one; this is the single highest-leverage fix for new-user comprehension.

  **Effort:** Low.

  **Priority:** Critical.

  **Dependencies:** None. Reads better alongside **Give the paste field a visible label and a real home**.

- [ ] **Stop Reset from silently destroying every world and every saved preference**

  **What:** Change the Reset action to clear only the current world's current-day overrides, and update the confirmation dialog to describe exactly what it will remove.

  **Where:** `resetOverrides` in [useBriefingState.ts:228](hooks/useBriefingState.ts:228); the dialog in [MorningTibiaDashboard.tsx:153](components/dashboard/MorningTibiaDashboard.tsx:153).

  **How it should work:** `resetOverrides` currently calls `briefingRepository.clearAll()`, which iterates all of `localStorage` and deletes every key starting with `morning-tibia:v1` — that is *every world*, *every past day*, plus the briefing language, the rich/plain preference, the events window, the market basis and the viewer timezone. It then force-resets the world back to `Ustebra` and the language back to `pt`. Replace this with `briefingRepository.clearOverrides(world, dateKey)` — a method that already exists on the repository interface and is **never called anywhere in the app** — followed by `setOverrides(createDefaultOverrides(world, referenceDate))`. Keep the world selection, language, format, timezone and market basis untouched. If a "clear everything on this device" escape hatch is still wanted, make it a separate, explicitly-worded secondary action inside the dialog.

  **Why:** The dialog promises *"Everything you pasted or filled in for {world} today will be cleared."* The implementation does far more than that, including silently switching the user's world and reverting their language. A user who resets Antica because they mis-pasted loses their Secura state, their Polish preference and their timezone — with no warning and no undo.

  **Example:** Dialog title *"Reset today's dispatch for Ustebra?"*, body *"Clears the world board reading, guide answers and anything you filled in for Ustebra on 10/09/2026. Other worlds, other days and your settings are untouched."*, plus a small `Clear all saved data on this device` text button.

  **Impact:** Removes a data-loss trap and makes an already-present, already-tested repository method do its job.

  **Effort:** Low.

  **Priority:** Critical.

  **Dependencies:** None.

- [ ] **Surface live-data failures instead of degrading silently**

  **What:** Render an explicit, actionable error state whenever any of the five live queries fails, and prevent a briefing built on failed data from looking authoritative.

  **Where:** `useAsyncResource`'s `error` field in [worldProvider.ts:227](lib/data/worldProvider.ts:227); consumed (or rather, not consumed) by [MorningTibiaDashboard.tsx](components/dashboard/MorningTibiaDashboard.tsx) and [Masthead.tsx](components/dispatch/Masthead.tsx).

  **How it should work:** Every query already computes and exposes `error`, and **not one component reads it** — the string is thrown away. Add a compact status strip directly beneath the masthead that appears only when at least one query is in error, naming which feed failed and offering Retry (wired to the existing `refreshLiveData`). Individually: the masthead's status line should say *"world status unavailable"* rather than vanishing; the boosted tiles should show *"couldn't load"* rather than `?` / `—`; the Numbers footer should omit the Market block with a one-line note rather than showing nothing. Critically, when `boostedQuery` has failed, the Copy/Share buttons should carry an inline warning that the briefing contains placeholders, because the whole point of the output is that someone pastes it into a guild channel as fact.

  **Why:** *Verified* — intercepting all TibiaData and `nesleykent.github.io` requests and hitting Refresh produced a masthead reading `Ustebra / ? — / ? —` with the online/PvP/BattlEye line gone entirely, no message anywhere, and a fully copyable briefing containing `N/D` for both boosted entries. The app looks like it is working. That is the worst possible failure mode for a tool whose output is shared as fact.

  **Example:** `⚠ Couldn't reach TibiaData — boosted creature and world status are missing. [Retry]` in a thin amber strip under the masthead, with the Copy button's label unchanged but a `contains placeholders` note beside it.

  **Impact:** Converts a trust-destroying silent failure into an honest, recoverable one; makes an already-computed piece of state useful.

  **Effort:** Medium.

  **Priority:** Critical.

  **Dependencies:** None.

- [ ] **Make the dispatch's server-save countdown live instead of frozen at page load**

  **What:** Drive the "Everything here resets at server save, in HH:MM:SS" line from a ticking clock, the same one the top status bar uses.

  **Where:** `saveMs` in [MorningTibiaDashboard.tsx:80](components/dashboard/MorningTibiaDashboard.tsx:80), rendered by `Numbers` in [Dispatch.tsx:144](components/dispatch/Dispatch.tsx:144).

  **How it should work:** `saveMs` is computed once from `referenceDate`, which is `useState(() => new Date())` and therefore frozen for the lifetime of the tab. The top bar's `useNow(...)` ticks every second. Extract that ticking clock into a shared hook (or lift it into `ViewerSettingsContext`) and feed both surfaces from it. While you are there, decide whether two countdowns to the same instant belong on one screen at all — the cleanest resolution is to keep the live one in the top bar and change the footer line to a non-numeric statement of the rule.

  **Why:** *Verified* — after roughly four minutes on the page, the footer read `00:58:24` while the top bar read `00:54:43`. The page shows the reader two different answers to the same question, and the wrong one is the one printed inside the document they are about to trust.

  **Example:** Either both read `00:54:43`, or the footer reads *"Everything here resets at the 10:00 server save."* with no number and the top bar keeps the countdown.

  **Impact:** Removes a visible self-contradiction in the product's core artifact.

  **Effort:** Low.

  **Priority:** Critical.

  **Dependencies:** Related to **Roll the day over at server save, not at local midnight**.

- [ ] **Roll the day over at server save, not at local midnight**

  **What:** Derive the storage day-key and the displayed date from the Tibia server-save boundary (10:00 CET/CEST) rather than the device's local calendar date, and re-evaluate it while the tab is open.

  **Where:** `toDateKey` / `toBriefingDate` in [lib/utils/date.ts](lib/utils/date.ts); `referenceDate` and `dateKey` in [useBriefingState.ts:43](hooks/useBriefingState.ts:43); `getNextServerSave` in [lib/utils/serverSave.ts](lib/utils/serverSave.ts) already computes the boundary correctly.

  **How it should work:** The app's entire domain model says the world resets at 10:00 CET — every clause in the dispatch is scoped to "today" in that sense. But `toDateKey` uses `date.getFullYear()/getMonth()/getDate()` in device-local time, so a Brazilian player's 07:00 session and their 09:00 session (both before server save) share a key with their 12:00 session (after it), and yesterday's confirmed-active changes are silently presented as today's. Introduce `toTibiaDayKey(date)` that subtracts the offset to the most recent server save before formatting, and use it for both the storage key and the displayed date. Additionally, watch for the boundary crossing while the tab is open: when `Date.now()` passes the next server save, show a dismissible banner — *"Server save has passed. Today's world has reset — this dispatch is from before the save."* — with a `Start today's dispatch` action that switches to the new day-key.

  **Why:** A morning-ritual app is precisely the kind of thing left open in a background tab. Today the tab silently keeps serving stale, now-wrong state as current, and the "reset at server save" line in the footer is the only hint — and it is frozen (see previous item). For an app whose whole selling point is never claiming false certainty, this is the biggest remaining source of it.

  **Example:** At 10:00:01 CET a banner appears above the masthead: *"Server save has passed — the world reset a moment ago. [Start today's dispatch]"*. Accepting it clears the stanzas and shows the first-run invitation.

  **Impact:** Closes the last route by which the app can present yesterday's facts as today's — the exact failure the domain model exists to prevent.

  **Effort:** Medium.

  **Priority:** Critical.

  **Dependencies:** Needs the shared ticking clock from **Make the dispatch's server-save countdown live instead of frozen at page load**.

- [ ] **Announce state changes to assistive technology**

  **What:** Add polite live regions for the paste receipt, the copy confirmation, and the fact that the dispatch has been rewritten.

  **Where:** the receipt `<p>` in [EvidenceBar.tsx:74](components/dispatch/EvidenceBar.tsx:74); the Copy button's `copied` state in [MorningTibiaDashboard.tsx:196](components/dashboard/MorningTibiaDashboard.tsx:196); the `<article>` in [Dispatch.tsx:32](components/dispatch/Dispatch.tsx:32).

  **How it should work:** *Verified* — `document.querySelectorAll('[aria-live],[role=status],[role=alert]').length === 0`. There is no live region anywhere in the app, yet the entire interaction model is "paste text → the page silently rewrites itself". Wrap the receipt in `role="status"` so *"Full board reading — 2 running, 21 ruled out"* is announced. Give the Copy button an adjacent `role="status"` node that announces *"Briefing copied"*. Add a single visually-hidden `aria-live="polite"` summariser that announces the shape of the change after a paste (e.g. *"Dispatch updated: 2 changes running, 2 still need you"*) rather than making the reader re-traverse the whole article to find out what moved.

  **Why:** A screen-reader user can paste a board log and receive no feedback whatsoever that anything happened.

  **Example:** After Add to today: *"Full board reading. 2 changes running, 21 ruled out. Two facts still need you."*

  **Impact:** Makes the app's core loop usable without sight; also improves the sighted experience, since the receipt is currently easy to miss.

  **Effort:** Low.

  **Priority:** Critical.

  **Dependencies:** None.

- [ ] **Restore the boosted-region input lost in the dispatch redesign**

  **What:** Bring back a way to record today's boosted region(s), so the briefing line that already exists can ever be populated.

  **Where:** `setBoostedRegions` in [useBriefingState.ts:218](hooks/useBriefingState.ts:218) (exported, **never called**); `boostedRegionValue` in [briefingModel.ts:290](lib/formatter/briefingModel.ts:290); the location catalog in [lib/defaults/tibiaLocations.ts](lib/defaults/tibiaLocations.ts) (now entirely unreferenced by any component).

  **How it should work:** The redesign deleted `BoostedCard` without replacing its input. The state field, the persistence, the migration path (old single-string `boostedRegion` → `boostedRegions: string[]`), the curated location list and the briefing rendering are all still in place — only the control is gone, so `boostedRegionValue` is permanently `null` and the `🗺️ REGIÃO BOOSTADA` block can never appear. Reinstate it in the dispatch's own idiom rather than as a card: add a sentence to the masthead area or a dedicated opening clause with a multi-select blank — *"Today's boosted region is `which region?`"* — using the same `Blank` popover component, with `spatial: true` so it renders as the two-column location grid. Extend `Blank` to support multi-select (the model is `string[]`), or accept single-select as the minimum useful version and note the limitation.

  **Why:** A documented, tested, persisted feature currently has no user-facing surface. Boosted region has no data source at all — the player is the only possible source — so removing the input removed the feature outright.

  **Example:** In the masthead's publication line, after the boosted pair: *"Boosted region: `which region?`"* → clicking opens the curated location grid → the briefing gains `🗺️ REGIÃO BOOSTADA / Kazordoon, Edron`.

  **Impact:** Restores a briefing section the guild-chat audience expects; un-orphans three files' worth of working code.

  **Effort:** Low (single-select) / Medium (multi-select).

  **Priority:** Critical.

  **Dependencies:** Multi-select variant depends on extending [Blank.tsx](components/dispatch/Blank.tsx).

- [ ] **Restore the market average-basis control lost in the dispatch redesign**

  **What:** Bring back the Last / Avg 3 / Avg 7 / Avg 14 selector that drives both the displayed market figures and the trend arrows.

  **Where:** `marketTrendBasis` / `setMarketTrendBasis` in [useBriefingState.ts:53](hooks/useBriefingState.ts:53); consumed by [Dispatch.tsx:160](components/dispatch/Dispatch.tsx:160) and [briefingModel.ts:217](lib/formatter/briefingModel.ts:217); persisted by [briefingRepository.ts:123](lib/storage/briefingRepository.ts:123).

  **How it should work:** Same shape of loss as boosted region: the state is read, persisted, migrated, unit-tested (`priceTrend.test.ts`) and feeds both the page footer and the generated briefing — but `setMarketTrendBasis` is never called from any component, so every user is permanently pinned to `"last"`. Add a small inline control in the `Numbers` footer's Market heading — four text toggles or a bare `Select` styled for the light page sheet — reading `Last · 3 · 7 · 14`. Changing it should update the four price figures, the four arrows and the briefing text simultaneously.

  **Why:** The README describes this as a headline feature and the reasoning behind it (a single tick's movement is noise; a 7-entry average moving is signal) is sound. Without the control, the app always shows the noisiest possible reading.

  **Example:** `MARKET   Last · 3 · 7 · 14` where the active option is `ink`-coloured and the rest `ink-soft`; picking `7` changes `41,510 ↑` to the 7-entry average and recomputes the arrow.

  **Impact:** Restores the market feature's actual value; makes the trend arrow meaningful instead of jittery.

  **Effort:** Low.

  **Priority:** Critical.

  **Dependencies:** None.

- [ ] **Localise the dispatch interface, not just the briefing output**

  **What:** Translate the on-screen dispatch (stanza headings, clause prose, blank prompts, opportunity text, footer labels, controls) into the same four languages the briefing already supports, driven by the existing language selector.

  **Where:** [composeDispatch.ts](lib/dispatch/composeDispatch.ts) (all clause text and `ASKS`), [Dispatch.tsx](components/dispatch/Dispatch.tsx), [Masthead.tsx](components/dispatch/Masthead.tsx), [EvidenceBar.tsx](components/dispatch/EvidenceBar.tsx), [Reference.tsx](components/dispatch/Reference.tsx), [TopStatusBar.tsx](components/dashboard/TopStatusBar.tsx), and `<html lang>` in [layout.tsx:30](app/layout.tsx:30).

  **How it should work:** Every default in the app points at a Brazilian audience — briefing language `pt`, viewer timezone `America/Sao_Paulo` (Curitiba), online count formatted with `toLocaleString("pt-BR")` — yet the entire interface is English. The reader is asked to understand *"A fury gate burns open near which city?"* in English and then paste a Portuguese bulletin. Move the dispatch's clause catalog into the same shape as [miniWorldChangeNarratives.ts](lib/formatter/miniWorldChangeNarratives.ts) (which already carries all four languages for exactly these changes) and have `composeDispatch` take a `language` argument. Set `<html lang>` from the selected language. Promote the language selector out of the share row into the top bar, since it now governs the whole page.

  **Why:** This is the largest single gap between the product's stated audience and its actual experience. It also removes a duplicated content catalog: right now `composeDispatch`'s English clauses and `miniWorldChangeNarratives`'s four-language sentences describe the same 26 changes twice, and neither the README nor the "How to add a new Mini World Change" instructions mention that adding a change now requires editing both.

  **Example:** `IN THE WORLD` → `NO MUNDO`; *"A fury gate burns open near `which city?`"* → *"Um portão de fúria se abriu perto de `qual cidade?`"*, sourced from the same catalog that already produces *"Um fiery fury gate se abriu perto de uma das grandes cidades"* for the briefing.

  **Impact:** Makes the product usable in its primary language; collapses two parallel content catalogs into one.

  **Effort:** High.

  **Priority:** Critical.

  **Dependencies:** Best done together with **Unify the dispatch clause catalog with the briefing narrative catalog**.

---

## High-Impact Improvements

- [ ] **Report copy failures instead of swallowing them**

  **What:** Use the boolean `useCopyToClipboard` already returns, and show a failure path.

  **Where:** `copy` in [useCopyToClipboard.ts:9](hooks/useCopyToClipboard.ts:9) returns `ok`; both call sites in [MorningTibiaDashboard.tsx:196](components/dashboard/MorningTibiaDashboard.tsx:196) and `handleShare` ignore it.

  **How it should work:** The hook tries the async Clipboard API, falls back to `execCommand`, and returns `false` if both fail — but the caller discards it, so a failed copy is indistinguishable from doing nothing. On `false`, switch the button to an error state (*"Couldn't copy — select the text below"*), select the contents of the `<pre>` preview automatically, and announce it in the live region. `handleShare` should do the same when both `navigator.share` and the clipboard fallback fail.

  **Why:** Copy is *the* terminal action of the whole ritual. Silent failure means the user walks away believing they have a briefing on their clipboard.

  **Example:** Button briefly becomes `⚠ Couldn't copy` with the preview text pre-selected below it.

  **Impact:** Protects the product's single most important action.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Live region from **Announce state changes to assistive technology**.

- [ ] **Add undo for a paste**

  **What:** Let the user reverse the effect of the last "Add to today" in one click.

  **Where:** `apply` in [EvidenceBar.tsx:34](components/dispatch/EvidenceBar.tsx:34); state ownership in [useBriefingState.ts](hooks/useBriefingState.ts).

  **How it should work:** A complete board reading marks up to 21 changes `inactive` in a single click, and the *only* way back is the Reset dialog — which currently wipes everything (see Critical). Snapshot `overrides` before applying, keep the previous snapshot in memory, and render `Undo` next to the receipt for as long as it is the most recent action. Restoring should write the snapshot back through `persist` so localStorage stays consistent.

  **Why:** The paste is a high-consequence, one-click, irreversible bulk write. Pasting yesterday's log, or the wrong world's log, is an obvious and likely mistake with no cheap recovery.

  **Example:** `Full board reading — 2 running, 21 ruled out.  ·  Undo`

  **Impact:** Removes the anxiety from the app's riskiest action and makes experimentation safe.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Cleaner after **Stop Reset from silently destroying every world and every saved preference**.

- [ ] **Stop the Reference view painting every unasked row gold**

  **What:** Reserve the gold accent dot and gold text for facts that genuinely need the reader, and give unasked Guide rows a neutral treatment.

  **Where:** `Row`'s `accent` prop and `Inline`'s `accent` in [Reference.tsx:172](components/dispatch/Reference.tsx:172), passed as `accent={!stateLabel}` at [Reference.tsx:106](components/dispatch/Reference.tsx:106).

  **How it should work:** *Verified* — on a fresh session, all 14 Guide NPC rows render with a gold dot and gold monospace keyword, and 3 Mini World Change rows do too. The design system's own stated rule is *"Gold is spent on exactly one thing: a fact that is missing and needs the reader. Nothing decorative is ever gold, which is what lets a single unfilled blank pull the eye across the whole page."* Seventeen simultaneous gold accents destroy that. Treat "never asked" as the neutral default (`muted-foreground`, no dot) and reserve gold for the genuinely actionable minority: a change confirmed running whose variant is still unknown, and the silent changes awaiting an eyes-on answer. Add a group header per state so the reason is stated once — `Running`, `Needs you`, `Can't be checked remotely`, `Ruled out`, `Not checked` — rather than encoded in a colour.

  **Why:** The accent currently signals "this row exists", which is no signal at all, and it makes the reference view read as a wall of alarm on first visit.

  **Example:** `NEEDS YOU (3)` group at the top with gold dots; `NOT CHECKED (23)` group below, entirely neutral.

  **Impact:** Restores the meaning of the product's only accent colour; makes the catalog scannable.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Show each achievement opportunity's caveat**

  **What:** Render the `caveat` field on opportunity entries.

  **Where:** the opportunity `<li>` in [Dispatch.tsx:70](components/dispatch/Dispatch.tsx:70); the field is defined in [types/achievement.ts](types/achievement.ts) and populated throughout [lib/defaults/achievements.ts](lib/defaults/achievements.ts).

  **How it should work:** The type's own documentation says `caveat` is *"A limit the UI must not paper over — a multi-day grind, a per-server-save cap, a one-incarnation-per-visit rule. Shown so an 'opportunity' is never oversold."* *Verified* — `grep` finds zero references to `caveat` anywhere in `components/`, `app/`, `lib/dispatch/`, `lib/formatter/` or `lib/achievements/`. Render it as a third line under the task, in `ink-faint`, prefixed with a bullet or `Note:`. Consider promoting `whyToday` (also unrendered) as a tooltip on the evidence clause.

  **Why:** *Goldhunter* currently reads as something you can finish today; its caveat says *"Cumulative across days — today can only advance it by one."* *Honest Finder*'s caveat says the bag must be handed in before the next server save. Withholding these is exactly the overselling the data model was designed to prevent — the app is currently violating its own stated invariant.

  **Example:**
  > **Goldhunter**
  > Return 5 Bags with Stolen Gold in total, across separate Bank Robberies. *Because Bank Robbery is running.*
  > *Note: cumulative across days — today can only advance it by one.*

  **Impact:** Restores honesty to the feature the product is proudest of; costs one line of JSX.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Make Guide keywords actionable in the dispatch and the reference**

  **What:** Show the exact keyword to say to a Guide NPC wherever a World Change appears, with click-to-copy.

  **Where:** `guideKeyword` in [lib/defaults/worldChanges.ts](lib/defaults/worldChanges.ts); currently used only as a `placeholder` in [Reference.tsx:109](components/dispatch/Reference.tsx:109) and as a truncated hint string in [EvidenceBar.tsx:82](components/dispatch/EvidenceBar.tsx:82).

  **How it should work:** The keyword is the single most operationally useful piece of data in the World Change catalog — it is literally what you type into the game. Today it appears as grey placeholder text that **disappears the moment a state is recorded**, and in a truncated `Guide keywords: Horestis, Mage Tower, … ` hint that vanishes as soon as any evidence exists. Instead: (a) in the Reference view, show the keyword permanently in a dedicated monospace column, each one click-to-copy; (b) add a `Copy all 14 keywords` action that yields a newline-separated block a player can paste straight into the client; (c) in the dispatch, give unasked World Changes a single closing clause — *"No guide has been asked yet. Say `world change` to any guide, then one of 14 keywords."* — with the keyword list behind a disclosure.

  **Why:** The app knows the exact words that unlock its own biggest missing data source and currently hides them behind the state of a form control.

  **Example:** `🏺 The Mummy's Curse   Horestis ⧉   [slumbering ▾]` — clicking `Horestis ⧉` copies it.

  **Impact:** Directly increases the amount of evidence users can collect, which is the app's supply constraint.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Link events to their TibiaWiki pages**

  **What:** Turn active and upcoming event titles into links using the `url` the data source already provides.

  **Where:** `ActiveEvent.url` / `UpcomingEvent.url` in [types/event.ts](types/event.ts), populated by `extractLinkTitleAndHref` in [wikiContentClient.ts:53](lib/data/wikiContentClient.ts:53); rendered without links in [Reference.tsx:143](components/dispatch/Reference.tsx:143).

  **How it should work:** *Verified* — the entire rendered page contains exactly **one** `<a>` element (an achievement source link). Every event already carries its wiki URL, fetched and parsed at build time, and it is discarded at render. Wrap the event title in an `<a target="_blank" rel="noreferrer">` when `url` is non-null, styled like the achievement links (underline in `ink-faint`, darkening on hover), with an external-link affordance.

  **Why:** "The Colours of Magic starts in 5 days" raises an obvious question — *what is it and what do I get?* — that the app has the answer to and refuses to hand over.

  **Example:** `🎨 The Colours of Magic → 15/09, in 5 days` where the title links to `https://tibia.fandom.com/wiki/The_Colours_of_Magic`.

  **Impact:** Two lines of JSX turn a dead-end list into a research jumping-off point.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Link every tracked change, creature and boss to TibiaWiki**

  **What:** Add outbound wiki links for Mini World Changes, World Changes, the boosted creature and the boosted boss.

  **Where:** [Reference.tsx](components/dispatch/Reference.tsx) rows, [Masthead.tsx](components/dispatch/Masthead.tsx) boosted tiles, and the running-change clauses in [Dispatch.tsx](components/dispatch/Dispatch.tsx).

  **How it should work:** Add an optional `wikiUrl` to `MiniWorldChangeDefinition` and `WorldChangeDefinition` (defaulting to `https://tibia.fandom.com/wiki/` + the canonical `name` with spaces underscored — the catalog names are already TibiaWiki-canonical, which is exactly why this is cheap). For the boosted pair, `BoostedEntity.name` maps the same way. In the dispatch, link the *place or creature* named in each clause rather than the change's catalog name, so the prose stays prose: *"The Forsaken Mine below Ab'Dendriel…"* links `Forsaken Mine`. In Reference, make the whole row name a link.

  **Why:** Every entry in this app was researched against TibiaWiki, and none of that research is one click away for the reader. A player who sees *"Mamma Longlegs is loose in the spider nest near Venore"* has an immediate next question (what level, what drops, where exactly) that a link answers for free.

  **Example:** Boosted tile: `Pirate Corsair` links to `https://tibia.fandom.com/wiki/Pirate_Corsair`.

  **Impact:** Turns the dispatch into a hub instead of a terminus, at near-zero data cost.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None. Feeds **Add a footer with sources, attribution and licensing**.

- [ ] **Show market price freshness on the page, not only in the briefing**

  **What:** Display the "as of" age next to the Market block in the dispatch footer.

  **Where:** `Numbers` in [Dispatch.tsx:144](components/dispatch/Dispatch.tsx:144); the age is already computed as `ageLabel` in [briefingModel.ts:232](lib/formatter/briefingModel.ts:232) for the briefing only.

  **How it should work:** *Verified* — the briefing rendered `*TIBIAMARKET.TOP (3d)*`, meaning the newest market entry was three days old, while the page itself showed `41,510 ↑` with no indication of age at all. The reader sees a confident number on screen and only learns it is stale if they read the generated text. Add the age beside the `MARKET` heading, and degrade the presentation when it exceeds a threshold (say 2 days): dim the figures and append `· stale`. Name the source on the page too, matching the briefing's attribution.

  **Why:** A three-day-old Tibia Coin price presented as current is actively misleading in a game with a live market.

  **Example:** `MARKET   tibiamarket.top · 3d ago`, with figures dimmed and a tooltip explaining the dataset refreshes about once a day.

  **Impact:** Closes a page-vs-output honesty gap in the one section made of hard numbers.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Pairs with **Restore the market average-basis control lost in the dispatch redesign**.

- [ ] **Give the two share-row toggles accessible names**

  **What:** Associate the "Plain text" and "Include quiet items" labels with their Radix `Switch` controls.

  **Where:** the two `<label>`-wrapped switches in [MorningTibiaDashboard.tsx:224](components/dashboard/MorningTibiaDashboard.tsx:224).

  **How it should work:** *Verified* — both switches report no accessible name: `[...document.querySelectorAll('button')].filter(b => !b.innerText.trim() && !b.getAttribute('aria-label'))` returns exactly these two. Radix's `Switch` renders a `<button role="switch">`, and a wrapping `<label>` does **not** provide an accessible name to a `<button>` (only labelable elements get that). Fix with `id` + `htmlFor` and `aria-labelledby` on the Switch, or simply add `aria-label` to each. Do the same audit for any future Radix control wrapped in a bare label.

  **Why:** A screen-reader user hears "switch, not pressed" twice with no idea what either does — including the toggle that changes the format of the thing they are about to paste into a chat.

  **Example:** `<Switch aria-labelledby="fmt-plain" />` with `<span id="fmt-plain">Plain text</span>`.

  **Impact:** Makes two of the app's five output controls operable non-visually.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Give the paste field a visible label and a real home**

  **What:** Replace the placeholder-as-label pattern on the evidence textarea with a visible label, supporting copy, and a paste-from-clipboard shortcut.

  **Where:** [EvidenceBar.tsx:52](components/dispatch/EvidenceBar.tsx:52).

  **How it should work:** The textarea's only description is its placeholder, which disappears on first keystroke and provides no accessible name (the `aria-label` sits on the wrapping `<section>`, not the control). Add a visible heading — *"Paste what the game told you"* — bound via `htmlFor`, plus one line of supporting copy naming the three sources and where to find them. Add a `Paste from clipboard` button using `navigator.clipboard.readText()` (with graceful degradation when the permission is denied), because the actual user flow is alt-tab from the Tibia client with the log already copied. Support `Cmd/Ctrl+Enter` to submit from inside the field.

  **Why:** This one control is the app's entire input surface, and it is currently the least explained element on the page.

  **Example:**
  > **Paste what the game told you**
  > The world board (Adventurer's Guild, floor +1), a guide's reply, or a towncryer shout — in any combination.
  > `[ textarea ]`
  > `[Add to today]  [Paste from clipboard]`

  **Impact:** Improves discoverability, accessibility and speed of the core loop at once.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Complements **Make the first-run invitation actually reachable**.

- [ ] **Reset scroll position when switching between Today and Everything**

  **What:** Scroll to the top of the content region when the view toggle changes.

  **Where:** the `setView` handler in [MorningTibiaDashboard.tsx:123](components/dashboard/MorningTibiaDashboard.tsx:123).

  **How it should work:** *Verified* — switching from Today (long) to Everything at scroll offset 500 leaves the reader mid-catalog with the column headers off-screen above them. Call `window.scrollTo({ top: 0, behavior: 'smooth' })` (or `'auto'` under `prefers-reduced-motion`) on view change, and move focus to the newly-rendered view's first heading so keyboard and screen-reader users are also repositioned.

  **Why:** The two views have very different heights and no shared landmarks; preserving scroll between them is disorienting rather than helpful.

  **Example:** Clicking `Everything` lands on `WORLD BOARD & TOWNCRYER — 26 tracked`.

  **Impact:** Removes a small but constant navigation friction.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Fix the extra blank line in the generated briefing when there are no opportunities**

  **What:** Filter out empty sections before joining the briefing's blocks.

  **Where:** the final `[...].join("\n\n")` in `renderRichBriefing` [generateBriefing.ts:286](lib/formatter/generateBriefing.ts:286) and `renderPlainBriefing` [generateBriefing.ts:437](lib/formatter/generateBriefing.ts:437).

  **How it should work:** `opportunitySection` evaluates to `""` when there are no opportunities, but it is still included in the array joined with `"\n\n"`, producing a doubled gap between World Changes and Next Events. Both renderers already have a `joinNonEmpty` helper — use it (or `.filter(Boolean)`) for the top-level join too. Add a test asserting no `\n\n\n` appears in either output.

  **Why:** The briefing is a formatted artifact pasted into WhatsApp and Discord, where a stray blank line is visible and looks careless. It is the one product surface that gets scrutinised by people who never visit the site.

  **Example:** `…conferir._\n\n*📅 PRÓXIMOS EVENTOS*` instead of `…conferir._\n\n\n\n*📅 PRÓXIMOS EVENTOS*`.

  **Impact:** Polishes the shareable output; trivially testable.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Add site metadata: favicon, icons, Open Graph and web manifest**

  **What:** Ship a favicon, apple-touch icon, a web app manifest, `metadataBase`, and Open Graph / Twitter card metadata.

  **Where:** [app/layout.tsx:15](app/layout.tsx:15) `metadata` export; [public/](public/) (currently contains only `.nojekyll`).

  **How it should work:** *Verified* — the built `out/` directory has no icon of any kind, and the rendered page's only meta tags are `viewport`, `theme-color`, `description` and Next's `next-size-adjust`. Add `icon.svg` / `apple-icon.png` (the sunrise mark already used in the top bar is the obvious source), a `manifest.webmanifest` with the dawn `#0b0d16` theme colour, and an `openGraph` block with a static 1200×630 image. Set `metadataBase: new URL("https://nesleykent.github.io/morning-tibia/")` so relative asset URLs resolve correctly under the GitHub Pages base path.

  **Why:** This app's distribution mechanism is *a person pasting a link into a guild chat*. Today that link renders as a bare URL with a blank favicon — the least persuasive possible presentation for a tool whose entire pitch is a good-looking daily bulletin.

  **Example:** Discord unfurl showing the sunrise mark, `Morning Tibia — Daily World Briefing`, and the existing description line.

  **Impact:** Directly improves the app's only growth channel.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Needs a designed OG image asset.

- [ ] **Unify the dispatch clause catalog with the briefing narrative catalog**

  **What:** Collapse the two parallel per-change prose catalogs into one source of truth.

  **Where:** `clauseFor` in [composeDispatch.ts:79](lib/dispatch/composeDispatch.ts:79) (26 English clauses) and [miniWorldChangeNarratives.ts](lib/formatter/miniWorldChangeNarratives.ts) (26 changes × 4 languages).

  **How it should work:** Both files describe the same 26 changes in prose, and they disagree — the page says *"An iceberg full of chakoyas has washed up north of Port Hope"* while the briefing says *"Um grande iceberg encalhou na costa ao norte de Port Hope"* (*verified* on the same screen). Extend the narrative catalog with the segment/blank metadata `composeDispatch` needs (which token is a gap, what it asks for) and have `composeDispatch` read from it, parameterised by language. Then update the README's "How to add a new Mini World Change" section, which currently instructs a contributor to touch three files and omits `composeDispatch` entirely — so a new change added by the book renders as the fallback `"<Name> is running."` on the page.

  **Why:** Two catalogs of the same content will drift, and the contribution guide already leads people into the drift.

  **Example:** `getMiniWorldChangeClause("chakoya-iceberg", variantLabel, "pt")` returns segments used by both the page and the briefing.

  **Impact:** Removes a duplicated 26-entry content catalog and a documented trap; prerequisite for localising the dispatch cheaply.

  **Effort:** Medium.

  **Priority:** High.

  **Dependencies:** Should land before **Localise the dispatch interface, not just the briefing output**.

---

## New Features and Capabilities

- [ ] **Add a guided "ask a guide" checklist**

  **What:** A compact, ordered worklist of the 14 Guide keywords with per-keyword copy and one-tap state recording.

  **Where:** New section in the Everything view, or a dedicated third view.

  **How it should work:** Minimum useful version: a numbered list of the 14 World Changes, each row showing the keyword in monospace with a copy button and the documented state options as inline chips. Tapping a chip records the state directly — no dropdown, no paste. Rows already answered collapse to a single line and sink to the bottom; the count in the header reads `4 of 14 asked`. A `Copy all keywords` action produces the full block for a player who prefers to ask everything in one sitting and paste the whole transcript back afterwards.

  **Why:** World Changes are the app's weakest-populated data source, and the reason is friction: a player must know that greeting a Guide and saying `world change` is a thing, then remember 14 keywords, then copy the replies back. The app knows all 14 keywords and every documented reply, and currently helps with none of it.

  **Example:** `3. Master's Voice ⧉   [ quiet ] [ whispers ] [ chanting ]` — one tap records the state and strikes the row.

  **Impact:** Attacks the app's actual supply constraint on evidence.

  **Effort:** Medium.

  **Priority:** High.

  **Dependencies:** Builds on **Make Guide keywords actionable in the dispatch and the reference**.

- [ ] **Add a market history sparkline**

  **What:** A small inline chart of each tracked price's recent history, using the day-by-day data already fetched.

  **Where:** the Market block of `Numbers` in [Dispatch.tsx:144](components/dispatch/Dispatch.tsx:144); data from `MarketPrice.history` (`PriceSnapshot[]`).

  **How it should work:** Minimum useful version: a 60×16 inline SVG sparkline per price, drawn from the last 30 history entries, coloured neutrally with a single dot on the latest point — no library, no axes, no tooltip. Second iteration: hover/focus reveals a value-and-date readout, and the sparkline's window follows the selected average basis (30 entries for Last/3, 60 for 7, 90 for 14). The `↑/↓/→` arrow stays as the accessible summary; the sparkline is decorative (`aria-hidden`) with the numeric value as the accessible content.

  **Why:** The app already downloads *years* of daily history per item per world and renders exactly one number and one arrow from it. A sparkline is the cheapest possible way to turn that dataset into something a trader can act on, and it directly justifies the average-basis control.

  **Example:** `Tibia Coin sell   ▁▂▃▅▄▆▇  41,510 ↑`

  **Impact:** Extracts real value from an already-paid-for data fetch; makes the market section a reason to return.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Best after **Restore the market average-basis control lost in the dispatch redesign**.

- [ ] **Add shareable URL state**

  **What:** Encode today's recorded state in the URL so a briefing can be shared as a live link, not just as pasted text.

  **Where:** New module `lib/storage/urlState.ts`; read on mount in [useBriefingState.ts](hooks/useBriefingState.ts); a `Copy link` action beside Copy/Share.

  **How it should work:** Minimum useful version: serialise `{world, dayKey, miniWorldChanges, worldChanges, merchants.yasir, boostedRegions}` into a compact base64url payload in the hash fragment (hash, not query — GitHub Pages serves a static export and the fragment never hits the server). On load, if a payload is present and its `dayKey` matches the current Tibia day, hydrate from it and show a `Viewing a shared dispatch · Make it mine` banner; if the day has passed, show it read-only with a `This is from <date>` notice. Cap the payload with short ids so a typical day stays well under 2,000 characters.

  **Why:** Today the only shareable artifact is a text blob. A link means one guild member does the board reading and everyone else opens the live, timezone-adjusted, language-switchable page — which is a strictly better product than a screenshot of a WhatsApp message. It also gives the app a distribution loop it currently lacks.

  **Example:** `nesleykent.github.io/morning-tibia/#d=eyJ3Ijoi…` → opens Ustebra with today's two running changes and Yasir's city already filled.

  **Impact:** Converts a single-player tool into a guild tool without a backend.

  **Effort:** Medium.

  **Priority:** High.

  **Dependencies:** Should land after **Roll the day over at server save, not at local midnight** so the embedded day-key means the right thing.

- [ ] **Add a "yesterday / recent days" history view**

  **What:** Let the user browse dispatches already saved for previous days on this device.

  **Where:** New view or a date control beside the world selector; data already in `localStorage` under `morning-tibia:v1:overrides:{world}:{dateKey}`.

  **How it should work:** Minimum useful version: enumerate the existing override keys for the selected world, show the last 14 days as a compact list (`10/09 — 2 running · 09/09 — 4 running · …`), and let the user open one read-only. The dispatch renders exactly as it does today but with an unmistakable *"This is 09/09 — not today"* header and Copy disabled or clearly relabelled.

  **Why:** Every day's state is already persisted and then made permanently unreachable — the app can only ever show the current `dateKey`. A player who wants to know whether Grimvale ran last week, or who forgot to send yesterday's briefing, has the data sitting in their browser with no way to see it.

  **Example:** `Ustebra ▾  ·  10/09 (today) ▾` where the second control lists saved days.

  **Impact:** Makes an existing, invisible dataset useful and creates a reason to return that isn't purely "check today".

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Reads more sensibly after **Roll the day over at server save, not at local midnight**.

- [ ] **Add a next-warzone countdown**

  **What:** Alongside the list of today's warzone times, show which execution is next and how long until it starts.

  **Where:** the Warzones block of `Numbers` in [Dispatch.tsx:151](components/dispatch/Dispatch.tsx:151).

  **How it should work:** The footer currently lists `12:00 1-2-3 / 20:00 1-3-2 / 21:30 1-2-3 / 23:00 1-2-3` with no indication of which has passed. Compare each converted time against the shared ticking clock: dim executions already past, mark the next one, and add a single line — *"Next warzone 20:00 (1-3-2), in 4h 12m"*. Once all of today's have passed, say so rather than showing four dimmed times with no explanation. Add the same line to the generated briefing.

  **Why:** A schedule without a "you are here" marker makes the reader do arithmetic in a timezone they had to configure. The conversion work is already done; only the comparison is missing.

  **Example:** `WARZONES  12:00 1-2-3 · **20:00 1-3-2** · 21:30 1-2-3 · 23:00 1-2-3` with `Next in 4h 12m` beneath.

  **Impact:** Turns reference data into a prompt to act.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** Shared clock from **Make the dispatch's server-save countdown live instead of frozen at page load**.

- [ ] **Add a Discord-formatted output variant**

  **What:** A third briefing format alongside rich (WhatsApp) and plain, using Discord's markdown.

  **Where:** `renderRichBriefing` / `renderPlainBriefing` in [generateBriefing.ts](lib/formatter/generateBriefing.ts); `BriefingFormat` in [briefingRepository.ts:6](lib/storage/briefingRepository.ts:6).

  **How it should work:** WhatsApp's `*bold*` renders as literal asterisks in Discord, which is where a large share of Tibia guild coordination happens. Add `renderDiscordBriefing` using `**bold**`, `##` headings, `>` blockquotes for the narrative sentences, and `[title](url)` links for events and achievements — the URLs are already in the model. Change the "Plain text" switch into a three-way format selector (`WhatsApp · Discord · Plain`) persisted through the existing `preferredFormat` key with a migration for the two current values.

  **Why:** The formatter is deliberately isolated from React and already models the briefing abstractly; a third renderer is genuinely cheap, and the current rich output is visibly broken in one of the two channels the product targets.

  **Example:** `## 🎎 MINI WORLD CHANGES` / `> 🔥 **Fury Gates** — um portão de fúria se abriu…` with a working `[Trail of the Ape God](…)` link.

  **Impact:** Makes the output correct in a major distribution channel and adds working links to the shared artifact.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Add an achievement-progress checklist**

  **What:** Let a user mark which of the surfaced achievements they already have, so opportunities they've completed stop reappearing.

  **Where:** New persisted set in the repository (device-scoped, not day-scoped); filter applied in [Dispatch.tsx:70](components/dispatch/Dispatch.tsx:70).

  **How it should work:** Minimum useful version: a small `Got it` control on each opportunity that adds the achievement id to a persisted `completedAchievements` set; completed ones then render collapsed under a `2 already earned` disclosure rather than disappearing (so the user can un-mark). Cumulative achievements like *Goldhunter* get a count instead of a boolean — `3 / 5 bags returned` — incremented manually, which pairs naturally with surfacing the caveat.

  **Why:** The opportunities feature currently treats every user as a fresh character forever. A returning player sees the same *Trail of the Ape God* suggestion every time Stampede runs, long after earning it, which trains them to ignore the section.

  **Example:** `🏆 Worth doing before it ends` shows 1 new opportunity and `2 already earned ▾`.

  **Impact:** Makes the app's most-researched feature personal and durable across sessions.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Better after **Show each achievement opportunity's caveat**.

- [ ] **Add an optional server-save reminder notification**

  **What:** An opt-in browser notification a configurable number of minutes before the 10:00 CET server save.

  **Where:** New `hooks/useServerSaveReminder.ts`; opt-in control near the timezone selector.

  **How it should work:** Minimum useful version: a `Remind me before server save` toggle that requests `Notification` permission on click (never on load), stores the preference and an offset (15/30/60 min), and schedules a notification while the tab is open — *"Server save in 30 minutes. Bank Robbery ends — you still have a bag to return."*, naming any time-limited opportunity currently recorded. Be explicit in the UI that this only works while the tab is open; a service worker for background delivery is a later step (see **Ship the app as an installable PWA with an offline shell**).

  **Why:** Several of the app's own achievement caveats are literally *"before the next server save"*. The app knows the deadline, knows the task, and currently tells the user only if they happen to be looking at the page.

  **Example:** Notification: `Morning Tibia — Ustebra` / `Server save in 30 min. Honest Finder: hand in the Bag with Stolen Gold before then.`

  **Impact:** Makes the app useful when it is *not* being looked at — a category of value it currently has none of.

  **Effort:** Medium.

  **Priority:** Low.

  **Dependencies:** Shared clock; ideally **Ship the app as an installable PWA with an offline shell** for background delivery.

- [ ] **Add a world comparison view**

  **What:** Let a user see boosted status, online count, warzone schedule and market prices for several worlds side by side.

  **Where:** New view; data from the existing `useWorldsQuery` / `useWorldDetailQuery` / `useMarketHistoryQuery` hooks.

  **How it should work:** Minimum useful version: a sortable table of up to 5 pinned worlds with columns for online count, PvP type, BattlEye, location, today's warzone count and Tibia Coin sell price — pinned worlds persisted locally. Sorting by any column; the currently-selected world highlighted. Boosted creature/boss are global, so they belong in the header, not as columns.

  **Why:** Market prices and warzone schedules are genuinely per-world and vary meaningfully, and the app fetches them per world already. Players who trade across worlds, or who are choosing where to start a character, have no way to compare without switching the selector repeatedly and remembering.

  **Example:** `World | Online | PvP | BattlEye | Warzones | TC sell` — Antica 1,204 · Open · Green · 4 · 41,220 ↑

  **Impact:** Adds a distinct, data-backed reason to use the site beyond the daily ritual.

  **Effort:** High.

  **Priority:** Low.

  **Dependencies:** Rate-limiting care against TibiaData when fetching several worlds.

---

## Information and Content Improvements

- [ ] **Surface each change's location, description and how-to-check**

  **What:** Expose the researched `location`, `description`, `howToCheck` and `reference` fields that currently render nowhere.

  **Where:** [Reference.tsx](components/dispatch/Reference.tsx) rows; fields defined in [types/miniWorldChange.ts](types/miniWorldChange.ts) and [types/worldChange.ts](types/worldChange.ts), populated in [lib/defaults/miniWorldChanges.ts](lib/defaults/miniWorldChanges.ts) and [lib/defaults/worldChanges.ts](lib/defaults/worldChanges.ts).

  **How it should work:** *Verified* — `grep` for `.description`, `.location` and `alternativeSource` across `components/` returns nothing; `howToCheck` appears once (the silent stanza); `reference` (Noodles' known server-save spawn points) appears nowhere despite the README promising *"his known server-save spawn areas are shown as a hint"*. Make each Reference row expandable: clicking the name reveals location, the one-line description, `howToCheck` where present, `alternativeSource` where present (e.g. Pyro Peter in Venore also reports Thornfire), and the `reference` hint list. Keep the collapsed row exactly as dense as it is today.

  **Why:** A carefully-sourced body of content is sitting in the repository with no route to the screen. *"Noodles is Gone"* is the clearest case: the app knows the four places he spawns at server save, deliberately models them as a hint rather than a claim, and then shows nobody.

  **Example:** Expanding `🐕 Noodles is Gone` reveals *Thais · The Duke's dog has wandered off again. Known server-save spawns: inside the castle kitchen · around the Rain Castle · north-west of Thais, behind the castle river · …*

  **Impact:** Multiplies the informational value of the reference view at zero research cost.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Pairs with **Link every tracked change, creature and boss to TibiaWiki**.

- [ ] **Show achievement grade and points**

  **What:** Render the `grade` and `points` fields on each opportunity.

  **Where:** the opportunity `<li>` in [Dispatch.tsx:70](components/dispatch/Dispatch.tsx:70); fields in [types/achievement.ts](types/achievement.ts), populated for all 26 entries.

  **How it should work:** Both fields are researched, typed and populated, and neither is referenced anywhere outside the defaults file. Show them as a compact trailing badge next to the existing Premium marker: `Grade 1 · 2 pts`. Sorting could optionally offer "by points" as an alternative to the current required-then-prerequisites ordering.

  **Why:** Achievement points are the currency of the achievement system; a player deciding whether a detour is worth it wants to know whether it is 1 point or 10. The data is right there.

  **Example:** `Goldhunter  ·  Grade 1 · 2 pts · Premium`

  **Impact:** Makes the opportunity list actionable rather than merely informative.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** Same JSX as **Show each achievement opportunity's caveat** — do them together.

- [ ] **Replace the "Quiet today" run-on sentence with a scannable disclosure**

  **What:** Restructure the ruled-out summary from a 21-item comma list into a collapsed, countable, scannable block.

  **Where:** the `quiet` stanza in [composeDispatch.ts:218](lib/dispatch/composeDispatch.ts:218).

  **How it should work:** *Verified* output today: *"21 other changes were on the board and are not running: Bank Robbery, Bored, Chyllfroest, Devovorga's Essence, Down the Drain, Fire from the Earth, Grimvale, Hive Outpost, Jungle Camp, Kingsday, Lumberjack, Nightmare Isles, Nomads, Noodles is Gone, Poacher Caves, River Runs Deep, Spider Nest, Spirit Grounds, Stampede, Thawing, Warpath."* — a 240-character sentence nobody reads. Keep the headline sentence (*"21 other changes were on the board and are not running."*) as the always-visible line, and put the names behind a `Show them` disclosure rendering as a three-column list in `ink-faint`, each name linked to its wiki page. The information is genuinely low-value-per-item but high-value-in-aggregate, which is exactly what a disclosure is for.

  **Why:** The redesign's stated principle — *"Nineteen facts of no interest, reduced to the one sentence they are worth"* — is right, but the execution still prints all nineteen names into the sentence.

  **Example:** `Quiet today` / *"21 other changes were on the board and are not running."* `Show them ▾`

  **Impact:** Removes the single densest, least-readable block in the dispatch while keeping the information available.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** Wiki links from **Link every tracked change, creature and boss to TibiaWiki**.

- [ ] **Add a footer with sources, attribution and licensing**

  **What:** A persistent footer crediting TibiaData, TibiaWiki, tibiamarket.top and the warzones-schedule dataset, with the project's own links.

  **Where:** [app/layout.tsx](app/layout.tsx), below `<main>`.

  **How it should work:** *Verified* — the entire page contains one link and no footer. TibiaWiki content is CC BY-SA, which makes attribution a licensing obligation rather than a courtesy, and the app derives its board messages, towncryer shouts, guide replies, event calendar and Drome rotation from it. Add a compact footer listing each data source with a link and one clause on what it provides, the CC BY-SA notice for TibiaWiki-derived content, the project's MIT licence and GitHub repository, and the standard "not affiliated with CipSoft" disclaimer that fan tools carry.

  **Why:** Attribution obligation, trust signal, and a discoverability route to the repository — all currently absent.

  **Example:** `Data: TibiaData v4 · TibiaWiki (CC BY-SA) · tibiamarket.top via tibia-warzones-schedule — Morning Tibia is a fan project, not affiliated with CipSoft. MIT · Source on GitHub`

  **Impact:** Fixes a licensing gap and makes the project's provenance legible.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Add an "About / How this works" page**

  **What:** A short static page explaining what the app knows, how it knows it, and what it deliberately refuses to claim.

  **Where:** New route `app/about/page.tsx`; linked from the footer and the first-run invitation.

  **How it should work:** One page, four sections: (1) *What this is* — the morning ritual, the shareable bulletin; (2) *The two mechanics* — Mini World Changes vs World Changes, with where to find the board, the towncryer and a Guide, illustrated; (3) *What the app will and won't claim* — the four knowledge states, why only a complete board reading proves a negative, why three changes can never be settled by a paste; (4) *Where the data comes from* — the sources table with freshness expectations. Most of this text already exists, written well, inside the README and the source-file doc comments.

  **Why:** The app's most distinctive property is its epistemic discipline, and it is entirely invisible to users — the only place it is explained is a 35KB developer README. A player who doesn't understand why 21 changes went grey after one paste has no way to find out, and a player who never learns that the world board *exists* can't use the app at all.

  **Example:** `/about` → *"Why doesn't pasting one line rule anything out?"* → *"Because the board is a listing, not an announcement…"*

  **Impact:** Converts the project's best thinking into user-facing value; supports first-run comprehension.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Complements **Make the first-run invitation actually reachable**.

- [ ] **Show how fresh the build-time data is**

  **What:** Display when the event/Drome data was last refreshed, and warn when it has gone stale.

  **Where:** [app/page.tsx](app/page.tsx) (capture `buildTime` and pass it through); rendered in the Events column of [Reference.tsx](components/dispatch/Reference.tsx) and in the footer.

  **How it should work:** Active events, upcoming events and the Drome rotation are fetched at build time and baked into the HTML, refreshed by a 6-hourly scheduled GitHub Actions run. Nothing on the page says so. `buildTime` is already constructed in `HomePage` and thrown away — pass it into the client and render `Events as of 10/09 04:17` beside the Events heading. If the age exceeds ~12 hours (two missed scheduled runs), degrade the presentation and say *"Event data may be out of date — the scheduled refresh hasn't run."*

  **Why:** `fetchWikiPageHtml` swallows every error and returns `null`, so a TibiaWiki outage or a markup change produces an empty Events list that is indistinguishable from "no events". Since the fetch runs during `next build`, a broken parse ships to production as silence and stays there for six hours minimum — with nobody informed.

  **Example:** `EVENTS   as of 10/09 04:17 · 7 days ▾`

  **Impact:** Makes a whole class of silent build-time failure visible to both users and the maintainer.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None. Pairs with **Fail the scheduled build loudly when TibiaWiki data comes back empty**.

- [ ] **Bring the README back in line with the code**

  **What:** Rewrite the Architecture and feature sections of the README to describe the dispatch, not the deleted dashboard.

  **Where:** [README.md](README.md), primarily the "What it does" and "Architecture" sections.

  **How it should work:** *Verified* — the README's component inventory lists `DailyHeader`, `ImportGameTextCard`, `BoostedCard`, `MiniWorldChangeGrid`, `WorldChangeGrid`, `MerchantCard`, `MarketPriceCard`, `WarzoneScheduleCard`, `EventCard`, `BriefingPreview`, `CopyButton` and `ToolbarActions`. **None of these files exist.** The actual components are `Masthead`, `Dispatch`, `Blank`, `EvidenceBar`, `Reference`, `TopStatusBar` and `WorldSelector`. Stale doc comments point at the same ghosts (`miniWorldChanges.ts` and `useBriefingState.ts` both reference `MerchantCard.tsx`/`MarketPriceCard`). Also update: the boosted-region and market-basis features described as shipped but currently unreachable; the "How to add a new Mini World Change" section, which omits `composeDispatch.ts`; and the Yasir auto-fill claim, which the board message can't actually satisfy (it always names all three cities).

  **Why:** The README is the project's design document and the onboarding path for any future contributor — including a future session of this work. Right now it describes a version of the app that no longer exists, and its contribution instructions produce a broken result.

  **Example:** Architecture block listing `components/dispatch/ — Masthead, Dispatch, Blank, EvidenceBar, Reference`.

  **Impact:** Restores the project's own map of itself.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Should land after the feature-restoration items so it documents the intended end state.

---

## Interaction and UX Improvements

- [ ] **Make the ten-city Fury Gates picker keyboard- and type-navigable**

  **What:** Add typeahead filtering and arrow-key navigation to the `Blank` popover's option grid.

  **Where:** `Options` in [Blank.tsx:62](components/dispatch/Blank.tsx:62).

  **How it should work:** The popover renders a plain `<div>` of `<button>`s — no roving tabindex, no typeahead, no `role="listbox"`. For the ten-city Fury Gates blank this means ten Tab presses to reach the last option. Convert to a `role="listbox"` / `role="option"` pattern with arrow keys moving in two dimensions (matching the visual grid), `Home`/`End`, typeahead that jumps to the first option starting with the typed letters, `Enter` to select and `Escape` to dismiss. The `cmdk` package is already a dependency (used by `WorldSelector`) if a searchable variant is preferred for the longest lists.

  **Why:** The two-column spatial grid is a genuinely good choice for "which of ten cities", but it currently costs a keyboard user ten tab stops and gives a screen-reader user no grouping at all.

  **Example:** Open the blank, type `th` → `Thais` is focused; `Enter` fills the sentence.

  **Impact:** Makes the app's signature interaction properly operable.

  **Effort:** Medium.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Add search and filtering to the reference catalog**

  **What:** A filter field and state filters over the 40 tracked entries.

  **Where:** [Reference.tsx](components/dispatch/Reference.tsx), above the two columns.

  **How it should work:** 26 Mini World Changes plus 14 World Changes are presented as two long unfiltered lists. Add a single text field that filters both columns simultaneously on name, location, keyword and description, plus state chips (`Running` / `Needs you` / `Ruled out` / `Not checked`) that toggle groups. Show `Showing 3 of 40` and a clear affordance. Persist nothing — this is a transient lookup tool.

  **Why:** The reference view's whole job is *"what is the app tracking, and what is this thing's state?"*, and answering it currently requires visually scanning two alphabetical lists. Once descriptions and locations are surfaced, search becomes the primary way in.

  **Example:** Typing `krailos` surfaces `🏝️ Shipwrecked` from its location field even though the name doesn't match.

  **Impact:** Makes a 40-row catalog usable as a lookup rather than a list.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** More valuable after **Surface each change's location, description and how-to-check**.

- [ ] **Add a mobile action bar for Copy and Share**

  **What:** A fixed bottom bar on small screens carrying the primary Copy action.

  **Where:** [MorningTibiaDashboard.tsx](components/dashboard/MorningTibiaDashboard.tsx) — note the container already carries `pb-32 sm:pb-16`, reserving space for a bar that does not exist.

  **How it should work:** *Verified* on a 375×812 viewport: the masthead alone consumes the entire first screen, and reaching Copy requires scrolling past the full dispatch, the silent stanza, the quiet list, the numbers footer and the paste field. The README even refers to *"the mobile action bar"* as an existing fixed surface. Add a solid-background (no `backdrop-filter`, per the documented Safari popover bug) fixed bar below `sm` containing `Copy briefing` and `Share`, appearing once the user has scrolled past the masthead, with the format/language controls behind a small overflow menu.

  **Why:** Mobile is the likeliest device for a WhatsApp-bound morning ritual, and on mobile the app's terminal action is the hardest thing to reach.

  **Example:** Fixed bar: `[ Copy briefing ]  [ Share ]  [ ⋯ ]`

  **Impact:** Removes a long scroll from the most common completion path on the most likely device.

  **Effort:** Medium.

  **Priority:** High.

  **Dependencies:** None.

- [ ] **Give the dispatch a real loading skeleton**

  **What:** Replace the generic three-block skeleton with one that matches the page it precedes.

  **Where:** the `!isClient` branch in [MorningTibiaDashboard.tsx:68](components/dashboard/MorningTibiaDashboard.tsx:68).

  **How it should work:** The current skeleton is a 12px bar, a 28px bar and a 420px rounded block on the dark field — nothing like the actual layout, which is a large serif world name, two boosted tiles, and a light page sheet. Shape the skeleton to the real thing: a wide title bar, a two-up tile row, then a `page-sheet`-coloured block with `skeleton-ink` line placeholders (that class already exists and is **never used**). Because the entire client shell is gated on `useIsClient`, this skeleton is what every visitor sees first, on every load.

  **Why:** A skeleton that doesn't predict the layout produces a visible reflow and reads as a loading spinner in disguise. Given this is the universal first paint, it is worth matching.

  **Example:** Skeleton silhouette identical to the loaded page, then content fades in with the existing `.settle` animation.

  **Impact:** Improves perceived performance for 100% of loads.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Move focus and summarise after a paste is applied**

  **What:** After "Add to today", move focus to the receipt and scroll the changed region into view.

  **Where:** `apply` in [EvidenceBar.tsx:34](components/dispatch/EvidenceBar.tsx:34).

  **How it should work:** Today the textarea clears, a one-sentence receipt appears below the button, and the dispatch 800px above silently rewrites itself. A user who pastes on mobile sees essentially nothing change. After applying: scroll the dispatch article into view, run the existing `.settle` stagger, move focus to the receipt (`tabIndex={-1}` + `role="status"`), and — if any blanks are now open — offer `Fill in 2 remaining facts →` that focuses the first unfilled `Blank`.

  **Why:** The redesign's stated intent is that *"facts arriving from a paste land in reading order — the stagger is the receipt"*, but the reader isn't looking at the region where the stagger happens.

  **Example:** Paste → page scrolls up → two clauses stagger in → `Full board reading — 2 running, 21 ruled out. · Fill in 2 remaining facts →`

  **Impact:** Makes the app's central cause-and-effect visible; helps keyboard and mobile users most.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Live region from **Announce state changes to assistive technology**.

- [ ] **Show world context inside the world selector**

  **What:** Add online count, PvP type and BattlEye status to each row of the world list.

  **Where:** [WorldSelector.tsx:64](components/dashboard/WorldSelector.tsx:64); the data is already present on the `World[]` returned by `useWorldsQuery`.

  **How it should work:** The selector maps `worlds` down to `.name` and discards every other field, so it shows a plain alphabetical list of ~90 identical strings. Render each row as `Antica · 1,204 online · Open PvP · 🟢`, keep the existing `cmdk` search working across all of those fields, and optionally group by region (Europe / North America / South America / Oceania) since `location` is available.

  **Why:** Choosing a world is a decision with real inputs, all of which the app has already fetched and thrown away.

  **Example:** Typing `open` filters to Open PvP worlds; typing `south` filters to South American ones.

  **Impact:** Turns a list into a chooser, at zero fetch cost.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Use `aria-current="page"` and tab semantics on the view switcher**

  **What:** Correct the accessibility semantics of the Today/Everything toggle.

  **Where:** [MorningTibiaDashboard.tsx:117](components/dashboard/MorningTibiaDashboard.tsx:117).

  **How it should work:** The buttons currently receive `aria-current={view === v}`, which renders `aria-current="false"` on the inactive one — technically valid but non-idiomatic, and the control is announced as two plain buttons with no indication that they form a set. Either use `aria-current={view === v ? "page" : undefined}`, or model it properly as `role="tablist"` / `role="tab"` / `aria-selected` with arrow-key navigation between tabs, which better matches what it actually is. Also add `id`/`aria-labelledby` linking each tab to its panel.

  **Why:** It is the app's only top-level navigation and it is currently announced as two unrelated buttons labelled "today" and "everything" (lowercase, since the capitalisation is CSS-only).

  **Example:** `role="tablist"` with `Today` / `Everything` tabs and Left/Right arrow navigation.

  **Impact:** Makes primary navigation comprehensible non-visually.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Give the Everything view its own heading and page title**

  **What:** Add an `<h1>` to the reference view and reflect the active view in the document title.

  **Where:** [Reference.tsx](components/dispatch/Reference.tsx); document title via `useEffect` in [MorningTibiaDashboard.tsx](components/dashboard/MorningTibiaDashboard.tsx).

  **How it should work:** *Verified* — the only `<h1>` on the site lives in `Masthead`, which renders only in the Today view. Switching to Everything leaves the page with no `<h1>` at all and a heading hierarchy that starts at `<h2>`. Add a visible `<h1>Everything Morning Tibia tracks</h1>` (or visually-hidden if the design must stay chromeless) and update `document.title` to `Everything — Morning Tibia` so browser history and tab titles distinguish the two views.

  **Why:** Screen-reader users navigating by heading land nowhere; browser history shows two identical entries for two different screens.

  **Example:** `<h1>` reading `Everything Morning Tibia tracks — 40 changes`.

  **Impact:** Fixes document structure on half the app.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Explain the Running / No buttons on silent changes**

  **What:** Give the two-button control on silent Mini World Changes a label explaining what it is asking.

  **Where:** the `Tiny` buttons in [Reference.tsx:73](components/dispatch/Reference.tsx:73).

  **How it should work:** In the Reference view, Beaver Breakout and Shipwrecked render as `🦫 Beaver Breakout  [Running] [No]` with no explanation of why these two rows have buttons when the other 24 have dropdowns or a dash. The dispatch's silent stanza explains it properly (*"Go to Silvertides in Marapur and look…"*) but the reference view doesn't. Add a group heading — `Can't be checked remotely — go and look` — and give each button an `aria-label` (`Mark Beaver Breakout as running`). Consider showing `howToCheck` inline here too.

  **Why:** The most conceptually subtle part of the domain model appears in the reference view stripped of the explanation that makes it make sense.

  **Example:** `CAN'T BE CHECKED REMOTELY (2)` group header above the two rows.

  **Impact:** Makes the app's most distinctive modelling decision comprehensible where it's most likely to confuse.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** Pairs with **Stop the Reference view painting every unasked row gold**.

- [ ] **Suppress the Forsaken blank until the player engages with it**

  **What:** Stop the "which creatures?" gap from being the first and only thing a new visitor sees.

  **Where:** the `forsaken` case in `clauseFor` [composeDispatch.ts:91](lib/dispatch/composeDispatch.ts:91); grouping in [dailyDigest.ts:82](lib/dashboard/dailyDigest.ts:82).

  **How it should work:** *Verified* — a fresh session's `IN THE WORLD` stanza contains exactly one line: *"The Forsaken Mine below Ab'Dendriel is full of `which creatures?`"*. Because Forsaken is `always-active`, it produces a clause every day forever, and on day one it is the entire dispatch — a gold gap demanding an answer before the reader knows what the page is. The briefing model already handles this correctly (`briefingModel.ts` skips an always-active change with no variant unless "include everything" is on); the dispatch does not. Apply the same rule: move Forsaken into the "Nothing announces these" stanza with its `howToCheck` text, and only promote it to a clause once the player has actually chosen a creature set.

  **Why:** The one thing the app most wants to communicate on first visit is *"paste your board reading"*, and instead it opens with an unanswerable question about a mine.

  **Example:** Fresh session's opening becomes the first-run invitation; Forsaken appears under `Nothing announces these — Forsaken: look down from the first floor before descending.`

  **Impact:** Fixes first-run framing and makes the page and the briefing agree on the same rule.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Do alongside **Make the first-run invitation actually reachable**.

---

## Visual and Presentation Improvements

- [ ] **Separate `--ink-soft` and `--ink-faint` into distinct levels**

  **What:** Re-tune the two secondary ink tokens so the intended three-level hierarchy on the page sheet actually exists.

  **Where:** [app/globals.css:27](app/globals.css:27).

  **How it should work:** The tokens are `--ink-soft: 232 12% 38%` and `--ink-faint: 232 12% 39%` — one percentage point apart. *Computed contrast on the page sheet:* `ink-soft` 6.22:1, `ink-faint` 6.00:1. They are visually indistinguishable, so the design's three-tier reading order (`ink` for statements, `ink-soft` for supporting prose, `ink-faint` for provenance and labels) collapses to two. Move `--ink-faint` to roughly `232 10% 52%` (≈3.9:1 — acceptable for the uppercase micro-labels and non-essential provenance it's used for) while keeping `--ink-soft` where it is for body-weight supporting text. Audit each `ink-faint` usage to confirm none of it carries essential information at small sizes.

  **Why:** The dispatch is a typographic document whose whole legibility strategy is tonal hierarchy, and one of its three tones is currently a duplicate.

  **Example:** `Because Fury Gates is running.` (faint) becomes clearly recessive against `Kill 5 Terrified Elephants…` (soft).

  **Impact:** Restores the reading hierarchy the page design depends on.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Fix the market trend arrow's contrast on the light page sheet**

  **What:** Give the up-trend glyph a darker variant when it renders on the page sheet.

  **Where:** the `TREND` map in [Dispatch.tsx:134](components/dispatch/Dispatch.tsx:134), using `--live` (`158 58% 36%`).

  **How it should work:** *Computed:* `--live` on `--page` is **3.51:1**, below the 4.5:1 AA threshold for the 13.5px glyph it's applied to. (`--danger` is 4.86:1 — it passes, barely.) The token was tuned for the dark night field, where it measures 5.06:1, and reused unchanged on the light sheet. Add `--live-on-page` at roughly `158 62% 26%` (≈6:1) and `--danger-on-page` for consistency, and use those inside the page sheet. The glyph itself already carries the meaning independent of colour, so this is a legibility fix rather than a colour-only-information fix.

  **Why:** These four arrows are the only encoded signal in the numbers footer, rendered small, on the app's lightest surface.

  **Example:** `41,510 ↑` where the arrow is clearly readable rather than washing into the parchment.

  **Impact:** Brings the last failing contrast pair in the palette up to AA.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Remove the dead design tokens from the Tailwind config**

  **What:** Delete Tailwind colour entries that reference CSS variables which no longer exist.

  **Where:** [tailwind.config.ts:52](tailwind.config.ts:52).

  **How it should work:** The config still declares `gold.muted` → `--gold-muted`, the whole `parchment` scale → `--parchment` / `--parchment-foreground` / `--parchment-border`, and the whole `status` scale → `--status-active` / `--status-inactive` / `--status-stage1..3` / `--status-unknown`. *None of these variables are defined in `globals.css`*, which was rewritten for the DAWN palette. Any class built from them silently resolves to `hsl()` with an empty value — invisible text. Delete them. While there, add `serif: ["var(--font-serif)", "Georgia", …]` to `fontFamily`, since `--font-serif` is loaded and used only through the hand-rolled `.prose-serif` class.

  **Why:** These are live footguns: `text-status-active` and `bg-parchment` autocomplete in the editor, typecheck fine, and render nothing.

  **Example:** `colors.status` and `colors.parchment` removed; `font-serif` becomes a usable Tailwind utility.

  **Impact:** Removes a class of invisible-styling bug and reconciles the config with the actual design system.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Keep a label on the server-save countdown at mobile widths**

  **What:** Ensure the top bar's server-save countdown is never a bare number.

  **Where:** [TopStatusBar.tsx:47](components/dashboard/TopStatusBar.tsx:47) — the `hidden sm:inline` on "Server save in".

  **How it should work:** *Verified* at 375px: the bar renders `▤ 00:55:21  ⏱ Drome #135 ends in 6d 00:54:56` — the Drome countdown keeps its full label while the server-save one is reduced to an icon and a number, so the *more* important of the two is the ambiguous one. Replace the hidden label with a short one that always shows (`SS in 00:55:21`, or `Save 00:55:21`), and keep the `title` attribute. Consider shortening the Drome label instead at the same breakpoint, since it's the less time-critical of the two.

  **Why:** An unlabelled countdown next to a labelled one reads as if both belong to the labelled thing.

  **Example:** `▤ Save 00:55:21 · ⏱ Drome #135 6d 00:54` on mobile.

  **Impact:** Removes an ambiguity in the app's most persistently visible element.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Tighten the mobile masthead so content appears above the fold**

  **What:** Reduce the vertical space the header consumes on small screens.

  **Where:** [Masthead.tsx](components/dispatch/Masthead.tsx) and the container paddings in [MorningTibiaDashboard.tsx:109](components/dashboard/MorningTibiaDashboard.tsx:109).

  **How it should work:** *Verified* at 375×812: the top bar, a large gap, the view toggle row, another gap, the date, a 38px serif world name, the status line and two stacked boosted tiles fill the entire first viewport — the dispatch's first sentence begins around y≈1240. Stack the two boosted tiles into one row of two on mobile (the artwork is 56px; two fit at 375px), reduce `pt-10` to `pt-6`, and tighten the gap between the view toggle and the masthead. Target: the first dispatch sentence visible within the first scroll.

  **Why:** The boosted pair is genuinely the masthead and deserves prominence, but at present the reader must scroll a full screen before the page says anything about their world.

  **Example:** Boosted creature and boss side by side at 56px, first stanza visible at y≈700.

  **Impact:** Gets the actual content above the fold on the most likely device.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** None.

- [ ] **Give the boosted tiles their meaning, not just their names**

  **What:** Add a one-line reason each boosted entry matters.

  **Where:** the `Boosted` component in [Masthead.tsx:66](components/dispatch/Masthead.tsx:66).

  **How it should work:** The tiles currently show a label, artwork and a name. Add a fixed explanatory line under each — *"Double experience and loot today"* for the creature, *"Extra loot, and it counts toward your daily boss cooldown"* for the boss — plus a link to the wiki page. This is static copy, not fetched data, so it costs nothing and answers the question a non-expert has when they see `Goshnar's Greed` for the first time.

  **Why:** The tiles are the largest, most prominent elements on the page and they assume the reader already knows what "boosted" confers. Newer players — exactly the audience a briefing tool helps most — don't.

  **Example:**
  > **BOOSTED CREATURE**
  > Pirate Corsair
  > *2× experience and loot today*

  **Impact:** Makes the visual centrepiece informative rather than decorative.

  **Effort:** Low.

  **Priority:** Medium.

  **Dependencies:** Wiki links from **Link every tracked change, creature and boss to TibiaWiki**.

- [ ] **Reconsider the always-visible briefing preview**

  **What:** Change the raw `<pre>` briefing preview into something that reflects what the reader will actually see when pasted.

  **Where:** the `<pre>` in [MorningTibiaDashboard.tsx:241](components/dashboard/MorningTibiaDashboard.tsx:241).

  **How it should work:** The preview shows the literal source — `*💸 COMERCIANTES*`, `_Nenhuma World Change…_` — in a 12.5px monospace scroll box on the night field. That's an accurate representation of the string but not of the *result*: in WhatsApp those asterisks become bold and the underscores become italics. Render a WhatsApp-style preview instead — a chat-bubble mock with the markup interpreted — while keeping a `View raw` toggle for people who want the exact characters. This also makes the format switch (WhatsApp / Discord / Plain) meaningfully visible rather than a subtle change in punctuation.

  **Why:** The stated reason for showing the preview outright is that *"the reader is about to paste this into a chat"* — which argues for showing what the chat will show, not the escape characters.

  **Example:** A green-tinted bubble with **COMERCIANTES** in bold and *Nenhuma World Change…* in italics, with `View raw ▾` beneath.

  **Impact:** Makes the app's output legible before it's sent and gives the format selector visible consequences.

  **Effort:** Medium.

  **Priority:** Low.

  **Dependencies:** Pairs with **Add a Discord-formatted output variant**.

---

## Performance and Technical Experience

- [ ] **Ship only the selected language's content catalogs**

  **What:** Code-split the four-language narrative and translation catalogs so a client downloads one language, not four.

  **Where:** [worldChangeNarratives.ts](lib/formatter/worldChangeNarratives.ts) (791 lines), [miniWorldChangeNarratives.ts](lib/formatter/miniWorldChangeNarratives.ts) (302), [phrases.ts](lib/formatter/phrases.ts) (364), [translations.ts](lib/formatter/translations.ts) (149).

  **How it should work:** All four languages are statically imported into the client bundle, so a Portuguese-only user downloads the complete English, Spanish and Polish narrative text for 40 changes across every state. Split each catalog into one module per language and load the active one with a dynamic `import()`, keyed off the selected `BriefingLanguage`, with the default (`pt`) statically imported so the common path has no waterfall. The build currently ships ~900KB of JS across eight chunks for a single-route app; these catalogs are a meaningful share of the largest one.

  **Why:** It is the single largest avoidable payload in a static site whose users load it every morning on mobile.

  **Example:** `pt` bundled by default; switching to `pl` fetches `narratives.pl.js` on demand.

  **Effort:** Medium.

  **Priority:** Medium.

  **Impact:** Meaningfully smaller first load, especially on mobile data.

  **Dependencies:** None. Interacts with **Localise the dispatch interface, not just the briefing output**, which will grow these catalogs further — worth sequencing before that lands.

- [ ] **Fail the scheduled build loudly when TibiaWiki data comes back empty**

  **What:** Make the 6-hourly refresh workflow detect and report an empty or unparseable TibiaWiki fetch.

  **Where:** [wikiContentClient.ts:19](lib/data/wikiContentClient.ts:19) (`fetchWikiPageHtml` returns `null` on any error); [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

  **How it should work:** Every failure path in the build-time fetcher is swallowed — a non-OK response, a JSON shape change, a network error, and (separately) any change to the wiki gadget's `data-type` div markup that makes the regex extraction return zero blocks. All of them produce an empty events list that ships to production and looks identical to a genuinely quiet week. Add a build-time assertion step: if `fetchActiveEvents` and `fetchUpcomingEvents` *both* return empty, or `fetchDromeRotation` returns a null rotation number, fail the build with a clear message rather than deploying silence. Since the workflow runs on a schedule, a failure surfaces as a GitHub Actions notification.

  **Why:** The app's most fragile dependency is HTML-regex scraping of a community wiki, and it currently degrades to silence with no alarm anywhere — for a minimum of six hours, and indefinitely if the markup change is permanent.

  **Example:** `Error: TibiaWiki returned no events and no Drome rotation — the gadget markup may have changed. Refusing to deploy empty event data.`

  **Impact:** Turns the app's most likely long-term breakage into something the maintainer finds out about.

  **Effort:** Low.

  **Priority:** High.

  **Dependencies:** Pairs with **Show how fresh the build-time data is**.

- [ ] **Ship the app as an installable PWA with an offline shell**

  **What:** Add a service worker that caches the app shell and the last successful live-data response.

  **Where:** New `public/sw.js` + registration; `manifest.webmanifest` from **Add site metadata: favicon, icons, Open Graph and web manifest**.

  **How it should work:** Minimum useful version: precache the static export's HTML, CSS, JS and fonts so a repeat visit paints instantly; use stale-while-revalidate for the TibiaData and warzones-schedule requests so a flaky connection shows yesterday's numbers with an explicit `offline — showing cached data` marker rather than the current silent blank. All the *user's own* state already lives in `localStorage`, so an offline session is genuinely useful: they can still read what they recorded and copy the briefing.

  **Why:** The usage pattern is "every morning, on a phone, often before the day's connection is good", and the product is a static site with essentially no server dependency — the perfect PWA candidate. Installability also gives the app a home-screen presence, which suits a daily ritual.

  **Example:** Added to home screen with the sunrise icon; opening it in airplane mode shows the full shell and yesterday's cached boosted pair with an offline marker.

  **Impact:** Instant repeat loads, graceful offline behaviour, and a persistent place in the user's daily routine.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** **Add site metadata: favicon, icons, Open Graph and web manifest**; layers on **Surface live-data failures instead of degrading silently**.

- [ ] **Trim the 420KB warzone schedule download**

  **What:** Avoid fetching the full multi-world warzone dataset to read one world's schedule.

  **Where:** `fetchAllWarzoneWorlds` in [worldProvider.ts:86](lib/data/worldProvider.ts:86).

  **How it should work:** The app downloads the complete `worlds.json` (~420KB, all ~90 worlds) and then `.find()`s a single entry. A five-minute module-level cache mitigates repeat cost within a session but not the first paint. Two options, in order of preference: (a) publish per-world files in `nesleykent/tibia-warzones-schedule` — it already does exactly this for market data (`data/market/world/{World}/…`), so the pattern and the tooling exist — and fetch one; (b) failing that, keep the bulk fetch but move it behind the initial render so it never blocks first paint, and persist the parsed result in `sessionStorage` so a reload is free.

  **Why:** It is the largest single network request the app makes, on every cold load, to extract roughly 200 bytes of useful data.

  **Example:** `GET /data/warzones/world/Ustebra.json` → 1.2KB instead of 420KB.

  **Impact:** Substantially faster and cheaper first load, particularly on mobile.

  **Effort:** Low (option b) / Medium (option a, requires a change in the upstream repository).

  **Priority:** Medium.

  **Dependencies:** Option (a) depends on `nesleykent/tibia-warzones-schedule`.

- [ ] **Replace the default 404 page**

  **What:** Add a branded not-found page that routes the visitor back to the dispatch.

  **Where:** New `app/not-found.tsx`; the export currently produces a stock Next 404 at `out/404.html`.

  **How it should work:** Under a GitHub Pages base path, a mistyped or stale URL is a realistic outcome — especially once shareable links exist. Add a short page in the app's own visual language: the sunrise mark, one sentence, and a link back to today's dispatch. If shareable URL state lands, also handle the case of a malformed payload here.

  **Why:** The 404 is currently the one screen that doesn't look like the product, and it will become more reachable as links get shared.

  **Example:** *"That page doesn't exist. → Today's dispatch"* on the dawn field.

  **Impact:** Keeps a stray visitor inside the product.

  **Effort:** Low.

  **Priority:** Low.

  **Dependencies:** None.

- [ ] **Add `robots.txt` and a sitemap**

  **What:** Emit `robots.txt` and `sitemap.xml` from the static export.

  **Where:** New `app/robots.ts` and `app/sitemap.ts` (Next's file conventions work with `output: "export"`).

  **How it should work:** With `metadataBase` set, generate a sitemap listing the routes that exist (`/`, and `/about` once it lands) and a permissive `robots.txt` pointing at it. Combined with the description already in `metadata` and a proper `<h1>`, this is the minimum for the site being findable by someone searching for a Tibia daily briefing tool.

  **Why:** The site has no discovery path at all today beyond a shared link — no icons, no social cards, no sitemap, and an `<h1>` that is just the selected world's name.

  **Example:** `https://nesleykent.github.io/morning-tibia/sitemap.xml` listing `/` and `/about`.

  **Impact:** Opens a second acquisition channel for a tool that currently only spreads by word of mouth.

  **Effort:** Low.

  **Priority:** Low.

  **Dependencies:** **Add site metadata: favicon, icons, Open Graph and web manifest** (for `metadataBase`).

- [ ] **Add component-level tests for the dispatch composition**

  **What:** Extend the test suite to cover `composeDispatch` and the dashboard's derived state.

  **Where:** New `lib/dispatch/composeDispatch.test.ts`; [vitest.config.ts](vitest.config.ts).

  **How it should work:** The suite is strong where it exists — 207 tests across parsers, formatters, timezone maths and catalog integrity, all passing — but `composeDispatch.ts`, the file whose doc comment calls it *"the heart of the redesign"*, has **no test file at all**. Neither the boosted-region regression nor the market-basis regression nor the unreachable empty state would have been caught by anything currently in the suite. Add tests asserting: a fresh digest produces the stanzas it should and no others; a complete board reading produces the quiet stanza with the right count; a silent change never leaves the silent stanza; every `MINI_WORLD_CHANGE_DEFINITIONS` id has a non-fallback clause (mirroring the existing `catalogIntegrity.test.ts` pattern); and every hook-exported setter has at least one caller (a cheap lint-style guard against exactly the two orphaned features found here).

  **Why:** Two shipped features were silently disconnected by a refactor and nothing failed. The catalogs are well guarded; the composition layer is not.

  **Example:** `expect(composeDispatch(freshDigest, merchants).map(s => s.id)).toEqual(["merchants", "silent"])` — which would currently fail, correctly, because of the Forsaken clause.

  **Impact:** Protects the layer where the recent regressions actually happened.

  **Effort:** Medium.

  **Priority:** Medium.

  **Dependencies:** Some assertions encode decisions made in **Suppress the Forsaken blank until the player engages with it** — write them after.

---

## Longer-Term Opportunities

- [ ] **Add an optional cloud backend for cross-device sync**

  **What:** Implement `BriefingRepository` against a hosted store so a user's state follows them between phone and desktop.

  **Where:** [lib/storage/briefingRepository.ts](lib/storage/briefingRepository.ts) — the interface already exists precisely for this.

  **How it should work:** The persistence layer was deliberately built behind an interface with the stated intent that *"swapping localStorage for a real backend later means implementing that interface once"*. A minimal version needs no accounts: a generated device key, a Cloudflare Workers + KV (or Supabase) endpoint keyed by `{key, world, dayKey}`, and a `Sync to my other devices` action that shows a pairing code. Keep `localStorage` as the write-through cache so offline behaviour is unchanged, and keep the whole feature optional — the app must continue to work fully with no backend, which is currently one of its best properties.

  **Why:** The morning ritual likely happens on a phone; the guild-channel paste may happen on a desktop. Today those are two unrelated app instances.

  **Example:** Pairing code `MORNING-4821` entered on the second device adopts the same state.

  **Impact:** Removes the last structural limitation on the app's daily use.

  **Effort:** High.

  **Priority:** Low.

  **Dependencies:** Introduces the project's first server-side component and a privacy/retention policy; **Add shareable URL state** delivers much of the value with none of that.

- [ ] **Add guild mode: one board reading serving many players**

  **What:** Let one person record today's world state and have their guild read the same live dispatch.

  **Where:** Builds on the backend above and on shareable URL state.

  **How it should work:** A guild gets a stable slug (`/g/vitalis`). Any member with the edit link can paste evidence; everyone else opens a read-only dispatch that reflects the latest state, in their own language and timezone, with a `last updated 14 minutes ago by …` line. Achievement opportunities and the briefing render per-viewer from shared evidence.

  **Why:** Board readings are a per-world, per-day public good — exactly one person needs to walk to the Adventurer's Guild. Today every guild member either repeats that walk or reads a static text paste that can't be corrected, re-languaged or re-timezoned.

  **Example:** `nesleykent.github.io/morning-tibia/g/vitalis` — read-only for members, editable with the link the officer holds.

  **Impact:** Changes the unit of value from one player's morning to a guild's morning; the strongest available growth mechanic.

  **Effort:** High.

  **Priority:** Low.

  **Dependencies:** **Add an optional cloud backend for cross-device sync**; **Add shareable URL state**.

- [ ] **Publish today's dispatch as a public JSON feed**

  **What:** Expose the composed world state as a machine-readable document other tools can consume.

  **Where:** New build/runtime endpoint; the model already exists as `BriefingModel`.

  **How it should work:** `BriefingModel` is already a flat, render-agnostic structure explicitly designed to be rendered many ways. Publish it (plus the raw digest) as JSON at a stable URL per world per day, alongside a documented schema. From a static export this can be a per-world file written at build time for the globally-true parts (boosted pair, events, Drome, market), with the player-supplied parts filled in client-side. Then a Discord bot, a stream overlay, or another fan site can build on it.

  **Why:** The project already consumes another of its author's published datasets (`tibia-warzones-schedule`) rather than duplicating work. Returning the favour makes Morning Tibia infrastructure rather than a leaf node, and the architecture is already 90% of the way there.

  **Example:** `GET /morning-tibia/api/world/Ustebra/today.json` → `{ "boosted": {...}, "warzones": [...], "market": {...} }`

  **Impact:** Turns a single-purpose site into a small platform.

  **Effort:** High.

  **Priority:** Low.

  **Dependencies:** Benefits from the backend for player-supplied state.

- [ ] **Localise the in-game proper names**

  **What:** Translate the ~40 Mini World Change and World Change names into the four supported languages.

  **Where:** [lib/defaults/miniWorldChanges.ts](lib/defaults/miniWorldChanges.ts), [lib/defaults/worldChanges.ts](lib/defaults/worldChanges.ts).

  **How it should work:** The README explicitly scopes this out today, and the resulting briefing mixes languages mid-sentence: *"Um fiery fury gate se abriu perto de uma das grandes cidades"* (*verified* in the PT output). Add an optional `displayName: Partial<Record<BriefingLanguage, string>>` per definition, falling back to the canonical English. Source names from TibiaWiki BR and the Spanish/Polish wikis where they exist; leave untranslated where no community name is established. Keep the canonical English visible somewhere (a parenthetical, or the reference view) since it is what players type and search for.

  **Why:** It is the last remaining place where the localised output reads as machine-assembled rather than written.

  **Example:** PT: *"Um portão de fúria se abriu perto de uma das grandes cidades."*

  **Impact:** Completes the localisation story the briefing already half-delivers.

  **Effort:** High (mostly research, not code).

  **Priority:** Low.

  **Dependencies:** **Localise the dispatch interface, not just the briefing output**.

- [ ] **Track how often each Mini World Change actually runs**

  **What:** Accumulate anonymous per-world observation history and surface base rates.

  **Where:** Requires the backend; presented in the Reference view.

  **How it should work:** Once complete board readings are being recorded server-side, each one is a dated, verified observation of all 23 announced changes at once — a genuinely high-quality dataset that does not exist publicly. Aggregate it into per-world frequency (`Grimvale ran 4 times in the last 30 days on Ustebra`), typical duration, and a `last seen` date per change. Surface `Last seen 12 days ago` on each Reference row — that single number would make the catalog worth visiting on its own.

  **Why:** "When did this last run and how often does it?" is a question every serious player has and nobody can answer today. The app is uniquely positioned to answer it because it already collects rigorously-validated complete readings and refuses to record anything it can't prove.

  **Example:** `🌲 Grimvale — last seen 12 days ago · ~1 in 9 days on this world`

  **Impact:** Creates a defensible, genuinely novel dataset out of a byproduct of the existing workflow.

  **Effort:** High.

  **Priority:** Low.

  **Dependencies:** **Add an optional cloud backend for cross-device sync**; needs an explicit, opt-in privacy stance on contributing readings.

---

## Recommended Implementation Order

**Phase 1 — Stop the bleeding (correctness and trust).** These are independent of each other and can go in any order within the phase; nothing else should ship before them.

1. **Stop Reset from silently destroying every world and every saved preference** — highest-severity data loss; one-line-ish change using a method that already exists.
2. **Make the first-run invitation actually reachable** — a broken front door blocks the value of everything downstream.
3. **Suppress the Forsaken blank until the player engages with it** — do this in the same pass as #2; together they define what a new visitor actually sees.
4. **Surface live-data failures instead of degrading silently** — the app currently publishes placeholders as fact.
5. **Report copy failures instead of swallowing them** — completes #4's story at the terminal action.
6. **Announce state changes to assistive technology** — foundation for #5's error announcement and for later focus work.
7. **Give the two share-row toggles accessible names** — trivial, same accessibility pass as #6.

**Phase 2 — Fix time.** Sequenced, because the clock is shared.

8. **Make the dispatch's server-save countdown live instead of frozen at page load** — extracts the shared ticking clock the next two items depend on.
9. **Roll the day over at server save, not at local midnight** — needs #8's clock to detect the boundary crossing.
10. **Add a next-warzone countdown** — consumes the same clock; cheap once #8 lands.

**Phase 3 — Restore what the redesign dropped.** Independent of each other.

11. **Restore the market average-basis control lost in the dispatch redesign** — smallest of the two restorations.
12. **Show market price freshness on the page, not only in the briefing** — same component as #11; do them together.
13. **Restore the boosted-region input lost in the dispatch redesign** — decide single- vs multi-select first.
14. **Add undo for a paste** — meaningfully safer once #1 has narrowed Reset's blast radius.
15. **Fix the extra blank line in the generated briefing when there are no opportunities** — isolated formatter fix.

**Phase 4 — Make the content pay off.** All independent; #16 unlocks the most downstream value.

16. **Link every tracked change, creature and boss to TibiaWiki** — establishes the `wikiUrl` derivation that #18, #21 and #24 all reuse.
17. **Link events to their TibiaWiki pages** — same pass as #16.
18. **Surface each change's location, description and how-to-check** — uses #16's links inside the expanded rows.
19. **Show each achievement opportunity's caveat** — resolves a documented invariant violation.
20. **Show achievement grade and points** — same JSX as #19; do them together.
21. **Replace the "Quiet today" run-on sentence with a scannable disclosure** — reads best with #16's links on the names.
22. **Add a footer with sources, attribution and licensing** — licensing obligation; also the home for #16's source list.
23. **Add site metadata: favicon, icons, Open Graph and web manifest** — prerequisite for the PWA and sitemap work later.

**Phase 5 — Interaction quality.** Independent unless noted.

24. **Make Guide keywords actionable in the dispatch and the reference** — prerequisite for the guided checklist.
25. **Give the paste field a visible label and a real home**.
26. **Move focus and summarise after a paste is applied** — depends on #6's live region.
27. **Add a mobile action bar for Copy and Share**.
28. **Tighten the mobile masthead so content appears above the fold** — same mobile pass as #27.
29. **Stop the Reference view painting every unasked row gold**.
30. **Explain the Running / No buttons on silent changes** — same Reference pass as #29.
31. **Reset scroll position when switching between Today and Everything**.
32. **Give the Everything view its own heading and page title** — same navigation pass as #31 and #33.
33. **Use `aria-current="page"` and tab semantics on the view switcher**.
34. **Make the ten-city Fury Gates picker keyboard- and type-navigable**.
35. **Show world context inside the world selector**.
36. **Add search and filtering to the reference catalog** — most valuable after #18 has given it something to search.
37. **Give the dispatch a real loading skeleton**.

**Phase 6 — Visual system repair.** All independent, all small.

38. **Remove the dead design tokens from the Tailwind config**.
39. **Separate `--ink-soft` and `--ink-faint` into distinct levels**.
40. **Fix the market trend arrow's contrast on the light page sheet**.
41. **Keep a label on the server-save countdown at mobile widths**.
42. **Give the boosted tiles their meaning, not just their names** — uses #16's links.

**Phase 7 — Technical foundation.**

43. **Fail the scheduled build loudly when TibiaWiki data comes back empty** — protects everything already shipped.
44. **Show how fresh the build-time data is** — user-facing half of #43.
45. **Trim the 420KB warzone schedule download**.
46. **Add component-level tests for the dispatch composition** — write after Phase 1–3 have settled the intended behaviour, so the assertions encode decisions rather than the current bugs.
47. **Ship only the selected language's content catalogs** — do before #50, which will grow those catalogs substantially.
48. **Ship the app as an installable PWA with an offline shell** — depends on #23.
49. **Replace the default 404 page** and **Add `robots.txt` and a sitemap** — both depend on #23's `metadataBase`.

**Phase 8 — Localisation and new capability.**

50. **Unify the dispatch clause catalog with the briefing narrative catalog** — must precede #51, or the localisation work doubles.
51. **Localise the dispatch interface, not just the briefing output** — the single largest remaining gap between audience and product.
52. **Add shareable URL state** — needs #9's day-key semantics to be correct.
53. **Add a guided "ask a guide" checklist** — builds on #24.
54. **Add a Discord-formatted output variant**.
55. **Reconsider the always-visible briefing preview** — best paired with #54.
56. **Add a market history sparkline** — best after #11.
57. **Add an achievement-progress checklist** — after #19.
58. **Add a "yesterday / recent days" history view** — after #9.
59. **Add an optional server-save reminder notification** — after #48.
60. **Add a world comparison view**.
61. **Bring the README back in line with the code** — last, so it documents the end state rather than a moving target.

**Phase 9 — Longer-term.** In order: **Add an optional cloud backend for cross-device sync** → **Add guild mode: one board reading serving many players** → **Track how often each Mini World Change actually runs** → **Publish today's dispatch as a public JSON feed** → **Localise the in-game proper names**.

---

## Best Quick Wins

Highest value per unit of effort. Every one of these is Low effort and independently shippable.

1. **Stop Reset from silently destroying every world and every saved preference** — swaps one already-implemented repository method for another and fixes a real data-loss bug.
2. **Make the first-run invitation actually reachable** — one boolean; converts a confusing first visit into a guided one.
3. **Show each achievement opportunity's caveat** — one line of JSX; resolves a violation of the product's own stated invariant.
4. **Link events to their TibiaWiki pages** — two lines of JSX using a URL already fetched and discarded; the page currently has exactly one link on it.
5. **Restore the market average-basis control lost in the dispatch redesign** — small control; un-orphans a fully-built, fully-tested feature.
6. **Give the two share-row toggles accessible names** — two attributes; makes two of five output controls operable non-visually.
7. **Fix the extra blank line in the generated briefing when there are no opportunities** — one `.filter(Boolean)`; polishes the artifact that other people actually see.

## Highest-Leverage Bets

Larger investments, ordered by how much they change what the product is.

1. **Localise the dispatch interface, not just the briefing output** — every default in the app targets a Portuguese-speaking audience and the entire interface is English. This is the widest gap between who the product is for and what it currently is, and closing it roughly doubles the addressable comprehension of the page. Pair with **Unify the dispatch clause catalog with the briefing narrative catalog**, which pays for a large share of the work by collapsing two parallel content catalogs into one.

2. **Add shareable URL state**, escalating later to **Add guild mode: one board reading serving many players** — a complete World Board reading is a per-world, per-day public good that exactly one person needs to collect. Today the only shareable artifact is a frozen text blob; a link makes one player's ten minutes serve their whole guild, with each reader getting their own language and timezone. This is simultaneously the biggest user-value multiplier and the only real growth loop available.

3. **Roll the day over at server save, not at local midnight** (with the live clock that precedes it) — the app's entire reputation rests on never claiming false certainty, and this is the last route by which it does exactly that. Fixing it makes the rigorous domain model actually true in practice, not just in the parser.

4. **Add a guided "ask a guide" checklist** — World Changes are the app's least-populated data source and the reason is pure friction the app is perfectly placed to remove. It knows all 14 keywords and every documented reply, and currently helps with neither. This directly attacks the supply constraint on the evidence the whole product runs on.

5. **Track how often each Mini World Change actually runs** — a complete board reading is a dated, rigorously-validated observation of 23 changes at once, and the app collects them as a byproduct of its normal loop. Aggregated, that becomes a dataset nobody else has and every serious player wants. A single `Last seen 12 days ago` line would make the reference view worth visiting on its own.

6. **Ship the app as an installable PWA with an offline shell** — the usage pattern (every morning, on a phone, before the connection is good) and the architecture (a static export with no server dependency) make this an unusually clean fit. Instant repeat loads plus a home-screen presence turn a website into part of a routine.
