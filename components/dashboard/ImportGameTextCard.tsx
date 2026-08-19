"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseGameText, type CombinedParseResult } from "@/lib/parser/parseGameText";
import type { ParsedSignal } from "@/types/parser";
import type { Merchant, MerchantId } from "@/types/merchant";
import type { MiniWorldChangeControlType } from "@/types/miniWorldChange";
import { MINI_WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/miniWorldChanges";
import { WORLD_CHANGE_DEFINITIONS } from "@/lib/defaults/worldChanges";

type ApplyChangeFn = (id: string, patch: { state: NonNullable<ParsedSignal["state"]>; detail: string }) => void;

interface ImportGameTextCardProps {
  onApplyMiniWorldChange: ApplyChangeFn;
  onApplyWorldChange: ApplyChangeFn;
  onApplyMerchant: (id: MerchantId, patch: Partial<Merchant>) => void;
}

const CONTROL_TYPE_BY_ID = new Map<string, MiniWorldChangeControlType>([
  ...MINI_WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.controlType] as const),
  ...WORLD_CHANGE_DEFINITIONS.map((def) => [def.id, def.controlType] as const),
]);

/** "active" with no detail only means "location/detail pending" for a detail-bearing
 * entry (location/creature/boss) — for a plain toggle or stage it just means active. */
function pendingsDetail(signal: ParsedSignal): boolean {
  if (signal.state !== "active" || signal.detail) return false;
  const controlType = CONTROL_TYPE_BY_ID.get(signal.changeId);
  return controlType === "location" || controlType === "creature" || controlType === "boss";
}

function SignalGroup({
  title,
  signals,
}: {
  title: string;
  signals: ParsedSignal[];
}) {
  if (signals.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {signals.map((signal, index) => (
        <div key={index} className="flex items-start justify-between gap-2 text-sm">
          <div>
            <p className="font-medium">{signal.label}</p>
            {signal.state ? (
              <p className="text-xs text-muted-foreground">
                →{" "}
                {pendingsDetail(signal)
                  ? "active, location/detail pending"
                  : signal.state === "location"
                    ? signal.detail
                    : signal.state}
                {signal.detail && signal.state !== "location" ? ` — ${signal.detail}` : ""}
              </p>
            ) : (
              <p className="text-xs text-amber-400">Matched, but no applicable state — check manually.</p>
            )}
          </div>
          {signal.state && (
            <Badge variant="gold" className="shrink-0">
              will apply
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

/** "23 Mini World Changes verified — 5 active, 18 inactive" style summary for a complete
 * World Board reading; omitted entirely for a fragmentary paste (nothing was "verified"). */
function boardSummary(result: CombinedParseResult): string | null {
  if (!result.isCompleteSnapshot) return null;
  const total = result.miniWorldChangeSignals.length;
  const activeCount = result.miniWorldChangeSignals.filter((s) => s.state && s.state !== "inactive").length;
  const inactiveCount = total - activeCount;
  return `World Board recognized as a complete reading — ${total} Mini World Changes verified (${activeCount} active, ${inactiveCount} inactive).`;
}

export function ImportGameTextCard({
  onApplyMiniWorldChange,
  onApplyWorldChange,
  onApplyMerchant,
}: ImportGameTextCardProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CombinedParseResult | null>(null);
  const [applied, setApplied] = useState(false);

  const applicableMiniWorldChanges = result?.miniWorldChangeSignals.filter((s) => s.state !== null) ?? [];
  const applicableWorldChanges = result?.worldChangeSignals.filter((s) => s.state !== null) ?? [];
  const applicableCount = applicableMiniWorldChanges.length + applicableWorldChanges.length;
  const summary = result ? boardSummary(result) : null;

  const handleParse = () => {
    setResult(parseGameText(text));
    setApplied(false);
  };

  const handleApply = () => {
    for (const signal of applicableMiniWorldChanges) {
      onApplyMiniWorldChange(signal.changeId, { state: signal.state!, detail: signal.detail });
    }
    for (const signal of applicableWorldChanges) {
      onApplyWorldChange(signal.changeId, { state: signal.state!, detail: signal.detail });
    }
    if (result?.inactiveMerchantIds.includes("yasir")) {
      onApplyMerchant("yasir", { location: "", activityState: "inactive" });
    }
    setApplied(true);
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">📋</span> Import from game text
        </CardTitle>
        <CardDescription>
          Paste any combination of the World Board&apos;s server log (Mini World Changes) and a
          Guide NPC chat log (World Changes) — two different Tibia mechanics with two different
          sources, but you only need one paste box. Both are detected automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            In-game: use the world board at the Adventurer&apos;s Guild (floor +1, near Charos) for
            Mini World Changes, and/or ask any Guide NPC about Horestis, Hive, Awash, Deepling, Sea
            Serpent, Demon War, Twisted Waters, or Overhunting for World Changes. Paste either or
            both logs below.
          </p>
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setApplied(false);
            }}
            placeholder="Paste your server log and/or Guide NPC chat log here…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={handleParse} disabled={!text.trim()}>
              Parse
            </Button>
            {result && applicableCount > 0 && (
              <Button type="button" size="sm" variant="secondary" onClick={handleApply} disabled={applied}>
                {applied ? (
                  <>
                    <Check /> Applied
                  </>
                ) : (
                  `Apply ${applicableCount} change${applicableCount === 1 ? "" : "s"}`
                )}
              </Button>
            )}
          </div>

          {result && (
            <div className="briefing-scrollbar flex max-h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
              {result.miniWorldChangeSignals.length === 0 &&
              result.worldChangeSignals.length === 0 &&
              result.merchantHints.length === 0 &&
              result.inactiveMerchantIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No known messages found in that text — nothing to import.
                </p>
              ) : (
                <>
                  {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
                  <SignalGroup title="Mini World Changes (World Board)" signals={result.miniWorldChangeSignals} />
                  <SignalGroup title="World Changes (Guide NPC)" signals={result.worldChangeSignals} />
                  {result.merchantHints.map((hint, index) => (
                    <div key={`hint-${index}`} className="text-sm">
                      <p className="font-medium capitalize">{hint.merchantId}</p>
                      <p className="text-xs text-muted-foreground">
                        Active, city pending — {hint.candidates.join(", ")}:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {hint.candidates.map((city) => (
                          <Button
                            key={city}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onApplyMerchant(hint.merchantId, { location: city, activityState: "location-known" })
                            }
                          >
                            {city}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {result.inactiveMerchantIds.includes("yasir") && (
                    <p className="text-xs text-muted-foreground">
                      Yasir wasn&apos;t mentioned in this complete board reading — marked inactive when applied.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
