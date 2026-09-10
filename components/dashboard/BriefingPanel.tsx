"use client";

import { Check, Copy as CopyIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { formatList } from "./formatList";
import { BRIEFING_LANGUAGES, type BriefingLanguage } from "@/lib/formatter/translations";

/**
 * The take-away.
 *
 * The whole ritual ends in one gesture — copy this, paste it into the guild's WhatsApp — so
 * the gesture is a single gold button that is on screen from the moment the page loads and
 * stays there while the reader scrolls the dispatch. It used to be the last thing on a
 * two-screen document, which meant the app's primary output was the hardest thing on it to
 * reach.
 *
 * The text is shown outright rather than behind a toggle: the reader is about to paste it into
 * a chat, and the dispatch above is in English while this is in their chosen language, so it
 * is genuinely different content and worth seeing before it leaves.
 */
export function BriefingPanel({
  briefing,
  copied,
  copyFailed,
  onCopy,
  onShare,
  language,
  onLanguageChange,
  plainText,
  onPlainTextChange,
  includeQuiet,
  onIncludeQuietChange,
  unavailable,
  panelRef,
  className,
}: {
  briefing: string;
  copied: boolean;
  copyFailed: boolean;
  onCopy: () => void;
  onShare: () => void;
  language: BriefingLanguage;
  onLanguageChange: (language: BriefingLanguage) => void;
  plainText: boolean;
  onPlainTextChange: (plain: boolean) => void;
  includeQuiet: boolean;
  onIncludeQuietChange: (include: boolean) => void;
  /** Feeds that failed, so the panel can say what this briefing leaves out. */
  unavailable: string[];
  /** Lets the page watch whether this panel is in view, and hide its phone-sized twin. */
  panelRef?: React.Ref<HTMLElement>;
  className?: string;
}) {
  return (
    <section
      ref={panelRef}
      // The one card with an accent edge, because it is the one card that is the output.
      className={cn(
        "surface overflow-hidden border-t-2 border-t-gold-bright p-4",
        className,
      )}
      aria-labelledby="briefing-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="briefing-heading"
          className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint"
        >
          Today&apos;s briefing
        </h2>
        <Select value={language} onValueChange={(v) => onLanguageChange(v as BriefingLanguage)}>
          <SelectTrigger className="h-7 w-[104px] text-[12px]" aria-label="Briefing language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {BRIEFING_LANGUAGES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="lg" onClick={onCopy} className="min-w-0 flex-1">
          {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copied" : "Copy briefing"}
        </Button>
        <Button size="lg" variant="outline" onClick={onShare} aria-label="Share briefing">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div role="status" aria-live="polite" className="mt-2 empty:mt-0">
        {copyFailed && (
          <p className="text-[12px] text-danger">
            Couldn&apos;t copy. Select the text below and copy it manually.
          </p>
        )}
        {copied && !copyFailed && (
          <p className="text-[12px] text-live">Briefing copied to your clipboard.</p>
        )}
      </div>

      <pre className="thin-scroll well mt-3 max-h-[15rem] overflow-y-auto whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-[1.6] text-ink-soft">
        {briefing}
      </pre>

      {unavailable.length > 0 && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
          Leaves out {formatList(unavailable)}. The app couldn&apos;t load{" "}
          {unavailable.length === 1 ? "it" : "them"}, so nothing is claimed about{" "}
          {unavailable.length === 1 ? "it" : "them"}.
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft pt-3">
        <LabelledSwitch label="Plain text" checked={plainText} onCheckedChange={onPlainTextChange} />
        <LabelledSwitch
          label="Include quiet items"
          checked={includeQuiet}
          onCheckedChange={onIncludeQuietChange}
        />
      </div>
    </section>
  );
}

/**
 * A Radix Switch renders a `<button role="switch">`, and a wrapping `<label>` gives a button
 * no accessible name — so both of these toggles were announced as "switch, not pressed" with
 * no indication of what they controlled.
 */
function LabelledSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-2 text-[12px] text-ink-soft">
      <Switch aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
      <span aria-hidden="true">{label}</span>
    </span>
  );
}
