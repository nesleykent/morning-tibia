"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { BriefingFormat } from "@/lib/storage/briefingRepository";
import { BRIEFING_LANGUAGES, type BriefingLanguage } from "@/lib/formatter/generateBriefing";

interface BriefingPreviewProps {
  richBriefing: string;
  plainBriefing: string;
  preferredFormat: BriefingFormat;
  onPreferredFormatChange: (format: BriefingFormat) => void;
  language: BriefingLanguage;
  onLanguageChange: (language: BriefingLanguage) => void;
  worldName: string;
}

export function BriefingPreview({
  richBriefing,
  plainBriefing,
  preferredFormat,
  onPreferredFormatChange,
  language,
  onLanguageChange,
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
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-parchment-foreground/60">
            Your briefing
          </p>
          <CardTitle className="mt-0.5 text-parchment-foreground">
            Ready to copy or share
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={language} onValueChange={(value) => onLanguageChange(value as BriefingLanguage)}>
            <SelectTrigger className="h-8 w-32 border-parchment-border/60 bg-parchment-foreground/5 text-parchment-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRIEFING_LANGUAGES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs
            value={preferredFormat}
            onValueChange={(value) => onPreferredFormatChange(value as BriefingFormat)}
          >
            <TabsList className="bg-parchment-foreground/10">
              <TabsTrigger value="rich" className="min-h-[36px] sm:min-h-0">
                Rich
              </TabsTrigger>
              <TabsTrigger value="plain" className="min-h-[36px] sm:min-h-0">
                Plain
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="briefing-scrollbar max-h-96 overflow-y-auto rounded-lg border border-parchment-border/60 bg-parchment-foreground/5 p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-parchment-foreground">
            {activeText}
          </pre>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy follows the Rich/Plain choice above rather than being a second, separate
              decision — previously "Copy briefing" always copied rich and "Copy plain text"
              always copied plain, so the tabs only changed what you looked at. */}
          <CopyButton
            key={preferredFormat}
            text={activeText}
            label={preferredFormat === "plain" ? "Copy plain text" : "Copy briefing"}
            variant="default"
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
