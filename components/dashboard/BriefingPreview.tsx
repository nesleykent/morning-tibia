"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { BriefingFormat } from "@/lib/storage/briefingRepository";

interface BriefingPreviewProps {
  richBriefing: string;
  plainBriefing: string;
  preferredFormat: BriefingFormat;
  onPreferredFormatChange: (format: BriefingFormat) => void;
  worldName: string;
}

export function BriefingPreview({
  richBriefing,
  plainBriefing,
  preferredFormat,
  onPreferredFormatChange,
  worldName,
}: BriefingPreviewProps) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const { copy } = useCopyToClipboard();
  const activeText = preferredFormat === "plain" ? plainBriefing : richBriefing;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Morning Tibia — ${worldName}`, text: activeText });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }
    const ok = await copy(activeText);
    setShareFeedback(ok ? "Copied — paste it wherever you'd like to share it." : "Couldn't copy.");
    setTimeout(() => setShareFeedback(null), 2500);
  };

  return (
    <Card className="border-parchment-border/60 bg-parchment text-parchment-foreground shadow-elevated">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-parchment-foreground">
          <span aria-hidden="true">📨</span> Briefing preview
        </CardTitle>
        <Tabs
          value={preferredFormat}
          onValueChange={(value) => onPreferredFormatChange(value as BriefingFormat)}
        >
          <TabsList className="bg-parchment-foreground/10">
            <TabsTrigger value="rich">Rich</TabsTrigger>
            <TabsTrigger value="plain">Plain</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="briefing-scrollbar max-h-96 overflow-y-auto rounded-lg border border-parchment-border/60 bg-parchment-foreground/5 p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-parchment-foreground">
            {activeText}
          </pre>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            text={richBriefing}
            label="Copy briefing"
            variant="default"
            size="sm"
          />
          <CopyButton
            text={plainBriefing}
            label="Copy plain text"
            variant="outline"
            size="sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleShare}>
            <Share2 /> Share
          </Button>
          {shareFeedback && (
            <span className="text-xs text-parchment-foreground/70">{shareFeedback}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
