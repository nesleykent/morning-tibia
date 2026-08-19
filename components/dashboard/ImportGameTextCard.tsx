"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseGameText, type CombinedParseResult } from "@/lib/parser/parseGameText";
import type { ParsedSignal } from "@/types/parser";
import type { MerchantId } from "@/types/merchant";

type ApplyChangeFn = (id: string, patch: { state: NonNullable<ParsedSignal["state"]>; detail: string }) => void;

interface ImportGameTextCardProps {
  onApplyMiniWorldChange: ApplyChangeFn;
  onApplyWorldChange: ApplyChangeFn;
  onApplyMerchant: (id: MerchantId, location: string) => void;
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
                → {signal.state === "location" ? signal.detail : signal.state}
                {signal.detail && signal.state !== "location" ? ` — ${signal.detail}` : ""}
              </p>
            ) : (
              <p className="text-xs text-amber-400">{signal.note}</p>
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
              result.merchantHints.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No known messages found in that text — nothing to import.
                </p>
              ) : (
                <>
                  <SignalGroup title="Mini World Changes (World Board)" signals={result.miniWorldChangeSignals} />
                  <SignalGroup title="World Changes (Guide NPC)" signals={result.worldChangeSignals} />
                  {result.merchantHints.map((hint, index) => (
                    <div key={`hint-${index}`} className="text-sm">
                      <p className="font-medium capitalize">{hint.merchantId}</p>
                      <p className="text-xs text-muted-foreground">
                        Suggests: {hint.candidates.join(", ")} — pick one:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {hint.candidates.map((city) => (
                          <Button
                            key={city}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onApplyMerchant(hint.merchantId, city)}
                          >
                            {city}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
