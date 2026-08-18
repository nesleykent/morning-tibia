"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseBoardLog } from "@/lib/parser/parseBoardLog";
import { parseGuideLog } from "@/lib/parser/parseGuideLog";
import type { ParseResult } from "@/types/parser";
import type { MerchantId } from "@/types/merchant";

type ApplyChangeFn = (id: string, patch: { state: NonNullable<ParseResult["signals"][number]["state"]>; detail: string }) => void;

interface ImportGameTextCardProps {
  onApplyMiniWorldChange: ApplyChangeFn;
  onApplyWorldChange: ApplyChangeFn;
  onApplyMerchant: (id: MerchantId, location: string) => void;
}

interface ImportPanelProps {
  instructions: string;
  placeholder: string;
  parse: (text: string) => ParseResult;
  onApplyChange: ApplyChangeFn;
  onApplyMerchant: ImportGameTextCardProps["onApplyMerchant"];
}

function ImportPanel({ instructions, placeholder, parse, onApplyChange, onApplyMerchant }: ImportPanelProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [applied, setApplied] = useState(false);

  const applicableSignals = result?.signals.filter((signal) => signal.state !== null) ?? [];

  const handleParse = () => {
    setResult(parse(text));
    setApplied(false);
  };

  const handleApply = () => {
    for (const signal of applicableSignals) {
      onApplyChange(signal.changeId, { state: signal.state!, detail: signal.detail });
    }
    setApplied(true);
  };

  return (
    <div className="flex flex-col gap-3 pt-3">
      <p className="text-xs text-muted-foreground">{instructions}</p>
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setApplied(false);
        }}
        placeholder={placeholder}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={handleParse} disabled={!text.trim()}>
          Parse
        </Button>
        {result && applicableSignals.length > 0 && (
          <Button type="button" size="sm" variant="secondary" onClick={handleApply} disabled={applied}>
            {applied ? (
              <>
                <Check /> Applied
              </>
            ) : (
              `Apply ${applicableSignals.length} change${applicableSignals.length === 1 ? "" : "s"}`
            )}
          </Button>
        )}
      </div>

      {result && (
        <div className="briefing-scrollbar flex max-h-64 flex-col gap-2.5 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
          {result.signals.length === 0 && result.merchantHints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No known messages found in that text — nothing to import.
            </p>
          ) : (
            <>
              {result.signals.map((signal, index) => (
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
  );
}

export function ImportGameTextCard({
  onApplyMiniWorldChange,
  onApplyWorldChange,
  onApplyMerchant,
}: ImportGameTextCardProps) {
  return (
    <Card className="border-gold/30">
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">📋</span> Import from game text
        </CardTitle>
        <CardDescription>
          Two different Tibia mechanics, two different sources: the World Board announces
          Mini World Changes; a Guide NPC reports on World Changes. Paste the matching log
          on each tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">World Board</TabsTrigger>
            <TabsTrigger value="guide">Guide NPC chat</TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <ImportPanel
              instructions="In-game: use the world board at the Adventurer's Guild (floor +1, near Charos) — it prints today's active Mini World Changes to your server log. Paste that log below."
              placeholder="Paste your server log with the world board's contents…"
              parse={parseBoardLog}
              onApplyChange={onApplyMiniWorldChange}
              onApplyMerchant={onApplyMerchant}
            />
          </TabsContent>
          <TabsContent value="guide">
            <ImportPanel
              instructions="In-game: ask any Guide NPC about Horestis, Hive, Awash, Deepling, Sea Serpent, Demon War, Twisted Waters, or Overhunting, then paste the chat log below. These are World Changes — a different mechanic from the World Board's Mini World Changes."
              placeholder="Paste your chat log with the Guide NPC…"
              parse={parseGuideLog}
              onApplyChange={onApplyWorldChange}
              onApplyMerchant={onApplyMerchant}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
