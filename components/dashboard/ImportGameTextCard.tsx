"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Section, Eyebrow, Note } from "@/components/ui/section";
import { parseGameText, type CombinedParseResult } from "@/lib/parser/parseGameText";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import { MINI_WORLD_CHANGES_BY_ID } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGES_BY_ID, GUIDE_KEYWORDS } from "@/lib/defaults/worldChanges";

interface ImportGameTextCardProps {
  onApplyMiniWorldChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  onApplyWorldChange: (id: string, patch: Partial<WorldChangeValue>) => void;
  onApplyMerchant: (id: MerchantId, patch: Partial<Merchant>) => void;
  /** True once this session has any evidence — the panel steps back once it has done its job. */
  hasImported: boolean;
}

/**
 * The paste box, designed for its two very different moments.
 *
 * Before anything is imported it is the point of the page, so it leads with the instructions
 * and an open textarea. Once a paste has landed, the *result* is what matters and the input
 * collapses to a single line the player can reopen — a full-height textarea plus a paragraph
 * of instructions has no business dominating the screen every morning after the workflow is
 * already understood.
 */
export function ImportGameTextCard({
  onApplyMiniWorldChange,
  onApplyWorldChange,
  onApplyMerchant,
  hasImported,
}: ImportGameTextCardProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CombinedParseResult | null>(null);
  const [manuallyOpen, setManuallyOpen] = useState(false);

  const collapsed = hasImported && !manuallyOpen;

  const handleParse = () => {
    const parsed = parseGameText(text);
    setResult(parsed);

    for (const signal of parsed.miniWorldChangeSignals) {
      onApplyMiniWorldChange(signal.changeId, { status: "active", variantId: signal.variantId });
    }
    for (const id of parsed.inactiveMiniWorldChangeIds) {
      onApplyMiniWorldChange(id, { status: "inactive", variantId: null });
    }
    for (const signal of parsed.worldChangeSignals) {
      onApplyWorldChange(signal.changeId, { stateId: signal.stateId });
    }
    for (const hint of parsed.merchantHints) {
      if (hint.merchantId !== "yasir") continue;
      onApplyMerchant("yasir", { location: "", activityState: "pending-location" });
    }
    if (parsed.inactiveMerchantIds.includes("yasir")) {
      onApplyMerchant("yasir", { location: "", activityState: "inactive" });
    }

    if (!parsed.isEmpty) {
      setText("");
      setManuallyOpen(false);
    }
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setManuallyOpen(true)}
          className="flex min-h-[38px] items-center gap-2 self-start text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:min-h-0"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Paste more game text
        </button>
        {result && !result.isEmpty && <ImportResult result={result} />}
      </div>
    );
  }

  return (
    <Section
      eyebrow="Import"
      title="Paste what the game told you"
      description="A World Board server log, a Guide NPC chat, Towncryer shouts — any combination. All three are recognised automatically."
    >
      <Textarea
        rows={hasImported ? 4 : 6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste your server log, Guide NPC chat, or Towncryer shouts here…"
        className="font-mono text-[12.5px]"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={handleParse} disabled={!text.trim()}>
          Parse &amp; apply
        </Button>
        {hasImported && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setManuallyOpen(false)}>
            Cancel
          </Button>
        )}
      </div>

      {!hasImported && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Note label="Mini World Changes">
            Use the world board at the Adventurer&apos;s Guild (floor +1, near Charos) and copy the
            whole log. <strong className="font-medium text-foreground">Keep its first line</strong>{" "}
            (&ldquo;You see the world board…&rdquo;) — that is how Morning Tibia knows it has the
            full list and may mark the rest as not running.
          </Note>
          <Note label="World Changes">
            Greet any Guide NPC, say <em>world change</em>, then a keyword:{" "}
            <span className="text-foreground">{GUIDE_KEYWORDS.join(", ")}</span>.
          </Note>
        </div>
      )}

      {result && <ImportResult result={result} />}
    </Section>
  );
}

/** What the paste established — the part that actually matters after submitting. */
function ImportResult({ result }: { result: CombinedParseResult }) {
  if (result.isEmpty) {
    return (
      <Note>
        No World Board, Towncryer or Guide NPC message was recognised in that text — nothing was
        changed.
      </Note>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-muted/30 p-3">
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        {result.isCompleteBoardReading ? (
          <>
            <span className="font-medium text-foreground">Complete World Board reading.</span>{" "}
            {result.miniWorldChangeSignals.length} running,{" "}
            {result.inactiveMiniWorldChangeIds.length} confirmed not running.
          </>
        ) : (
          <>
            <span className="font-medium text-foreground">Partial paste.</span> Only what it
            mentions was updated — nothing was marked as not running, because this text can&apos;t
            prove that.
          </>
        )}
      </p>

      {result.miniWorldChangeSignals.length > 0 && (
        <div>
          <Eyebrow>Mini World Changes</Eyebrow>
          <ul className="mt-1 flex flex-col gap-0.5">
            {result.miniWorldChangeSignals.map((signal) => {
              const def = MINI_WORLD_CHANGES_BY_ID.get(signal.changeId);
              const label = def?.variants.find((v) => v.id === signal.variantId)?.label;
              const pending = def && def.variants.length > 0 && !signal.variantId;
              return (
                <li
                  key={signal.changeId}
                  className="flex flex-wrap items-baseline gap-x-2 text-[13px]"
                >
                  <span className="text-foreground">{def?.name ?? signal.changeId}</span>
                  {label && <span className="text-gold">{label}</span>}
                  {pending && <span className="text-[12px] text-gold">needs a detail from you</span>}
                  <span className="ml-auto text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                    {signal.source}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result.worldChangeSignals.length > 0 && (
        <div>
          <Eyebrow>World Changes</Eyebrow>
          <ul className="mt-1 flex flex-col gap-0.5">
            {result.worldChangeSignals.map((signal) => {
              const def = WORLD_CHANGES_BY_ID.get(signal.changeId);
              const state = def?.states.find((s) => s.id === signal.stateId);
              return (
                <li key={signal.changeId} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                  <span className="text-foreground">{def?.name ?? signal.changeId}</span>
                  <span className="text-muted-foreground">{state?.label ?? signal.stateId}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result.inactiveMerchantIds.includes("yasir") && (
        <p className="text-[12px] text-muted-foreground">
          Yasir wasn&apos;t listed — marked as not trading today.
        </p>
      )}
    </div>
  );
}
