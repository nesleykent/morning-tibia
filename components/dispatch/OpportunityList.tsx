"use client";

import { useState } from "react";
import type { Opportunity, OpportunityKind } from "@/types/opportunity";

/** Website-only navigation. Filtering never changes briefing data or copy/share output. */
export function OpportunityList({ opportunities }: { opportunities: Opportunity[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const kinds = [...new Set(opportunities.map(({ definition }) => definition.kind))].sort();
  const visible = opportunities.filter((opportunity) => {
    const { definition, conditionName, conditionState } = opportunity;
    if (kind && definition.kind !== kind) return false;
    const text = [
      definition.subject, definition.kind, opportunityMeta(definition),
      definition.detail.en, definition.caveat?.en, definition.advisory?.en,
      ...(definition.prerequisites ?? []), conditionName, conditionState,
    ].join(" ").toLocaleLowerCase();
    return !search || text.includes(search);
  });

  return (
    <section id="daily-opportunities" className="settle mt-4">
      <h2 className="dispatch-section-title">Worth doing before it ends</h2>
      <div className="opportunity-controls">
        <input
          type="search"
          aria-label="Find opportunities"
          placeholder="Name, change or requirement"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink placeholder:text-ink-faint"
        />
        <select
          aria-label="Opportunity type"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="max-w-full rounded border border-line bg-surface px-2 py-1.5 text-[12px] text-ink"
        >
          <option value="">All types</option>
          {kinds.map((value) => <option key={value} value={value}>{KIND_LABEL[value]}</option>)}
        </select>
        <span role="status" aria-label={`${visible.length} of ${opportunities.length} opportunities`} className="whitespace-nowrap text-[11px] text-ink-faint">
          {visible.length} / {opportunities.length}
        </span>
        {(query || kind) && (
          <button type="button" className="text-[12px] text-gold underline underline-offset-2" onClick={() => { setQuery(""); setKind(""); }}>
            Clear
          </button>
        )}
      </div>
      {visible.length === 0 && (
        <p className="py-3 text-[13px] text-ink-soft">No opportunities match. Clear the filters to see everything.</p>
      )}
      <ul className="dispatch-opportunities">
        {visible.map(({ definition, conditionName, conditionState }) => (
          <li key={definition.id} className="dispatch-entry opportunity-entry">
            <div className="opportunity-name">
              <h3 className="dispatch-item-title">
                <a href={definition.sources[0]} target="_blank" rel="noreferrer"
                  className="underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-gold">
                  {definition.subject}
                </a>
              </h3>
              <span className="opportunity-kind">{definition.kind.replaceAll("-", " ")}</span>
            </div>
            {opportunityMeta(definition) && <p className="opportunity-meta">{opportunityMeta(definition)}</p>}
            <p className="opportunity-detail">{definition.detail.en}</p>
            {definition.prerequisites?.length ? (
              <p className="opportunity-detail"><strong className="font-semibold text-ink">Needs first:</strong> {definition.prerequisites.join(", ")}.</p>
            ) : null}
            {definition.caveat && (
              <p className="opportunity-note"><strong className="font-medium text-ink-soft">Note:</strong> {definition.caveat.en}</p>
            )}
            {definition.advisory && (
              <p className="opportunity-note"><strong className="font-medium text-ink-soft">Tip:</strong> {definition.advisory.en}</p>
            )}
            <p className="opportunity-condition">
              <span className="text-ink-faint">From </span>
              <strong className="font-medium text-ink-soft">{conditionName}</strong>
              {conditionState ? `: ${conditionState}.` : " is running."}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const KIND_LABEL: Record<OpportunityKind, string> = {
  bestiary: "Bestiary", boss: "Bosses", mount: "Mounts", achievement: "Achievements",
  quest: "Quests", item: "Items", access: "Access", service: "Services",
  hunting: "Hunting", progress: "Progress", outfit: "Outfits",
  timing: "Timing", "taming-item": "Taming items",
};

/**
 * The typed facts behind an opportunity, in the order a player weighs them: what kind of thing
 * it is, what it costs, and — always — when they can actually have it. `available-today` is the
 * only case with no availability chip, because an unqualified line already means today.
 */
function opportunityMeta(definition: Opportunity["definition"]): string {
  const parts: string[] = [];
  if (definition.bestiary) {
    parts.push(`${definition.bestiary.kills} kills`, `${definition.bestiary.charmPoints} charm`);
  }
  if (definition.achievement) {
    const { name, points, premium } = definition.achievement;
    // Name it unless the subject already is the achievement — a bare "1 pt" hanging off
    // "Mamma Longlegs" tells the reader a point exists without saying what earns it.
    const label = definition.kind === "achievement" ? "" : `${name}, `;
    parts.push(`${label}${points} ${points === 1 ? "pt" : "pts"}${premium ? ", Premium" : ""}`);
  }
  if (definition.bosstiary) parts.push(definition.bosstiary);
  if (definition.exclusive) parts.push("only in this state");
  if (definition.availability === "progressable-today") parts.push("progress only");
  if (definition.availability === "unlocks-future") parts.push("after server save");
  return parts.join(", ");
}

