"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseGameText, type CombinedParseResult } from "@/lib/parser/parseGameText";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MiniWorldChangeValue } from "@/types/miniWorldChange";
import type { WorldChangeValue } from "@/types/worldChange";
import { GUIDE_KEYWORDS } from "@/lib/defaults/worldChanges";

/**
 * How evidence enters the dispatch.
 *
 * Not an "Import section" — pasting is an action, not a place, so it is a single field beneath
 * the page it fills. The receipt is deliberately one sentence: the reader does not need a
 * per-change audit trail, they need to know whether the paste counted as a complete board
 * reading, because that is the only thing that changes what the page is allowed to claim.
 */
export function EvidenceBar({
  onApplyMiniWorldChange,
  onApplyWorldChange,
  onApplyMerchant,
  hasEvidence,
}: {
  onApplyMiniWorldChange: (id: string, patch: Partial<MiniWorldChangeValue>) => void;
  onApplyWorldChange: (id: string, patch: Partial<WorldChangeValue>) => void;
  onApplyMerchant: (id: MerchantId, patch: Partial<Merchant>) => void;
  hasEvidence: boolean;
}) {
  const [text, setText] = useState("");
  const [receipt, setReceipt] = useState<CombinedParseResult | null>(null);

  const apply = () => {
    const parsed = parseGameText(text);
    setReceipt(parsed);
    for (const s of parsed.miniWorldChangeSignals)
      onApplyMiniWorldChange(s.changeId, { status: "active", variantId: s.variantId });
    for (const id of parsed.inactiveMiniWorldChangeIds)
      onApplyMiniWorldChange(id, { status: "inactive", variantId: null });
    for (const s of parsed.worldChangeSignals) onApplyWorldChange(s.changeId, { stateId: s.stateId });
    for (const h of parsed.merchantHints)
      if (h.merchantId === "yasir")
        onApplyMerchant("yasir", { location: "", activityState: "pending-location" });
    if (parsed.inactiveMerchantIds.includes("yasir"))
      onApplyMerchant("yasir", { location: "", activityState: "inactive" });
    if (!parsed.isEmpty) setText("");
  };

  return (
    <section className="mt-6" aria-label="Paste game text">
      <Textarea
        rows={hasEvidence ? 2 : 4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the world board, a guide's reply, or the towncryer…"
        className="resize-y border-white/10 bg-white/[0.03] font-mono text-[13px] leading-relaxed text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/70"
      />
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="button" onClick={apply} disabled={!text.trim()}>
          Add to today
        </Button>
        {receipt && (
          <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
            {receipt.isEmpty ? (
              "Nothing recognised in that text."
            ) : receipt.isCompleteBoardReading ? (
              <>
                Full board reading — {receipt.miniWorldChangeSignals.length} running,{" "}
                {receipt.inactiveMiniWorldChangeIds.length} ruled out.
              </>
            ) : (
              <>
                Added {receipt.miniWorldChangeSignals.length + receipt.worldChangeSignals.length}.
                Nothing was ruled out — this text can&apos;t prove that.
              </>
            )}
          </p>
        )}
        {!hasEvidence && !receipt && (
          <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
            Guide keywords: {GUIDE_KEYWORDS.slice(0, 5).join(", ")}…
          </p>
        )}
      </div>
    </section>
  );
}
