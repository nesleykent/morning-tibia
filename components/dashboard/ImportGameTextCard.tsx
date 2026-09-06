"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
}

function variantLabel(changeId: string, variantId: string | null): string | null {
  if (!variantId) return null;
  const def = MINI_WORLD_CHANGES_BY_ID.get(changeId);
  return def?.variants.find((v) => v.id === variantId)?.label ?? variantId;
}

export function ImportGameTextCard({
  onApplyMiniWorldChange,
  onApplyWorldChange,
  onApplyMerchant,
}: ImportGameTextCardProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CombinedParseResult | null>(null);

  const handleParse = () => {
    const parsed = parseGameText(text);
    setResult(parsed);

    for (const signal of parsed.miniWorldChangeSignals) {
      onApplyMiniWorldChange(signal.changeId, {
        status: "active",
        variantId: signal.variantId,
      });
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
  };

  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">📋</span> Import from game text
        </CardTitle>
        <CardDescription>
          Paste the World Board&apos;s server log, a Guide NPC chat log, or anything the Towncryer
          shouted — in any combination. All three are recognised automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Mini World Changes</strong> — use the world board
              at the Adventurer&apos;s Guild (floor +1, near Charos) and copy the whole server log.
              Keep its first line (&ldquo;You see the world board…&rdquo;): that line is how Morning
              Tibia knows it has the full list and can mark everything else as not running. The
              Towncryer in Thais also shouts them one at a time.
            </p>
            <p>
              <strong className="text-foreground">World Changes</strong> — greet any Guide NPC, say{" "}
              <em>world change</em>, then one of: {GUIDE_KEYWORDS.join(", ")}.
            </p>
          </div>
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder="Paste your server log, Guide NPC chat, or Towncryer shouts here…"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={handleParse} disabled={!text.trim()}>
              Parse &amp; apply
            </Button>
          </div>

          {result && (
            <div className="briefing-scrollbar flex max-h-72 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
              {result.isEmpty ? (
                <p className="text-sm text-muted-foreground">
                  No known World Board, Towncryer or Guide NPC messages found in that text — nothing
                  was changed.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {result.isCompleteBoardReading ? (
                      <>
                        Complete World Board reading — {result.miniWorldChangeSignals.length} active,{" "}
                        {result.inactiveMiniWorldChangeIds.length} confirmed not running.
                      </>
                    ) : (
                      <>
                        Partial paste — only what it actually mentions was updated. Nothing was
                        marked as not running, because this text can&apos;t prove that.
                      </>
                    )}
                  </p>

                  {result.miniWorldChangeSignals.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Mini World Changes
                      </p>
                      {result.miniWorldChangeSignals.map((signal) => {
                        const def = MINI_WORLD_CHANGES_BY_ID.get(signal.changeId);
                        const label = variantLabel(signal.changeId, signal.variantId);
                        const pending = def && def.variants.length > 0 && !signal.variantId;
                        return (
                          <div
                            key={signal.changeId}
                            className="flex items-start justify-between gap-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{def?.name ?? signal.changeId}</p>
                              <p className="text-xs text-muted-foreground">
                                → active{label ? ` — ${label}` : ""}
                                {pending ? " — which one isn't in the message, pick it below" : ""}
                              </p>
                            </div>
                            <Badge variant="gold" className="shrink-0">
                              {signal.source === "towncryer" ? "towncryer" : "board"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {result.worldChangeSignals.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        World Changes
                      </p>
                      {result.worldChangeSignals.map((signal) => {
                        const def = WORLD_CHANGES_BY_ID.get(signal.changeId);
                        const state = def?.states.find((s) => s.id === signal.stateId);
                        return (
                          <div
                            key={signal.changeId}
                            className="flex items-start justify-between gap-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{def?.name ?? signal.changeId}</p>
                              <p className="text-xs text-muted-foreground">
                                → {state?.label ?? signal.stateId}
                              </p>
                            </div>
                            <Badge variant="gold" className="shrink-0">
                              guide
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {result.merchantHints.map((hint) => (
                    <div key={hint.merchantId} className="text-sm">
                      <p className="font-medium capitalize">{hint.merchantId}</p>
                      <p className="text-xs text-muted-foreground">
                        Trading somewhere — the message names {hint.candidates.length} possible
                        cities, not which one:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {hint.candidates.map((city) => (
                          <Button
                            key={city}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onApplyMerchant(hint.merchantId, {
                                location: city,
                                activityState: "location-known",
                              })
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
                      Yasir wasn&apos;t listed in this complete board reading — marked as not
                      trading today.
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
