"use client";

import { useId, useRef, useState } from "react";
import { ClipboardPaste, Undo2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { parseGameText, type CombinedParseResult } from "@/lib/parser/parseGameText";

/** What a paste actually changed, in the terms the reader cares about. */
interface Receipt {
  parsed: CombinedParseResult;
  running: number;
  ruledOut: number;
  guideAnswers: number;
  unreadableGuideReplies: number;
  merchant: boolean;
}

function buildReceipt(parsed: CombinedParseResult): Receipt {
  return {
    parsed,
    running: parsed.miniWorldChangeSignals.length,
    ruledOut: parsed.inactiveMiniWorldChangeIds.length,
    guideAnswers: parsed.worldChangeSignals.length,
    unreadableGuideReplies: parsed.guide.unrecognisedReplies.length,
    merchant: parsed.merchantHints.length > 0 || parsed.inactiveMerchantIds.length > 0,
  };
}

function countPhrase(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "2 running, 21 ruled out and 3 guide answers" — only the parts that actually happened. */
function summarise(receipt: Receipt): string {
  const parts: string[] = [];
  if (receipt.running > 0) parts.push(`${countPhrase(receipt.running, "change")} running`);
  if (receipt.ruledOut > 0) parts.push(`${receipt.ruledOut} ruled out`);
  if (receipt.guideAnswers > 0) parts.push(countPhrase(receipt.guideAnswers, "guide answer"));
  // A Guide reply the catalog cannot read is reported, not swallowed: silence here would hide
  // the one signal that the app's own message list has fallen behind the game.
  if (receipt.unreadableGuideReplies > 0) {
    parts.push(`${countPhrase(receipt.unreadableGuideReplies, "guide reply")} not recognised`);
  }
  if (receipt.merchant) parts.push("Yasir");
  if (parts.length === 0) return "nothing new";
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * How evidence enters the dispatch: the game log.
 *
 * This is the first thing the morning actually does — alt-tab out of Tibia with the Server Log
 * copied, drop it in, read what changed — so it sits at the top of the take-away rail, in view
 * from the moment the page loads, rather than under a document the reader has not read yet.
 *
 * The receipt says what changed, and it comes with an undo, because a board reading rules out
 * twenty-odd changes in one click. Applying the paste is a single atomic update owned by
 * useBriefingState, so "before" is a real snapshot rather than a replayed diff.
 *
 * Nothing here asks the reader whether their paste is a whole board. Using the board writes
 * the whole listing to the Server Log in one action, so a recognised board message already
 * implies the reading it came from; the question had no answer the reader could get wrong.
 */
export function EvidenceBar({
  onApply,
  onUndo,
  canUndo,
  hasEvidence,
  unresolvedCount,
  onJumpToUnresolved,
  className,
}: {
  onApply: (parsed: CombinedParseResult) => void;
  onUndo: () => void;
  canUndo: boolean;
  hasEvidence: boolean;
  /** How many blanks the dispatch still has open, after whatever the paste settled. */
  unresolvedCount: number;
  onJumpToUnresolved: () => void;
  className?: string;
}) {
  const [text, setText] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fieldId = useId();
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apply = () => {
    if (!text.trim()) return;
    const parsed = parseGameText(text);
    setReceipt(buildReceipt(parsed));
    setPasteError(null);
    onApply(parsed);
    if (!parsed.isEmpty) setText("");
  };

  /** The real flow is alt-tab from the game with the log already copied, so offer the
   * one-click version of it. Reading the clipboard needs permission and is not available
   * everywhere, so a refusal falls back to the field the reader can always type into. */
  const pasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setPasteError("Your clipboard is empty.");
        return;
      }
      setText(clipboardText);
      setPasteError(null);
      textareaRef.current?.focus();
    } catch {
      setPasteError("Couldn't read the clipboard. Paste into the box instead.");
      textareaRef.current?.focus();
    }
  };

  const canPasteFromClipboard =
    typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function";

  return (
    <section
      className={cn("surface p-4", className)}
      aria-labelledby={`${fieldId}-label`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id={`${fieldId}-label`}
          className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint"
        >
          Game log
        </h2>
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1 text-[12px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <Undo2 className="h-3 w-3" aria-hidden="true" /> Undo last paste
          </button>
        )}
      </div>

      <p id={hintId} className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
        The world board at the Adventurer&apos;s Guild, a guide&apos;s reply, or a towncryer
        shout, in any combination.
      </p>

      <Textarea
        ref={textareaRef}
        id={fieldId}
        // The heading names the section AND the control: labelling only the section left
        // the field itself anonymous, which for the app's one input surface is the worst
        // place to be missing a name.
        aria-labelledby={`${fieldId}-label`}
        aria-describedby={hintId}
        rows={hasEvidence ? 4 : 6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="This board will notify you of currently active mini world changes all over Tibia…"
        className="mt-2.5 resize-y font-mono text-[12px] leading-relaxed"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={apply} disabled={!text.trim()}>
          Add to today
        </Button>
        {canPasteFromClipboard && (
          <Button type="button" variant="outline" size="icon" onClick={pasteFromClipboard} title="Paste from clipboard" aria-label="Paste from clipboard">
            <ClipboardPaste className="h-4 w-4" />
          </Button>
        )}
        <span className="ml-auto hidden text-[11px] text-ink-faint sm:inline">⌘/Ctrl + Enter</span>
      </div>

      {/* role="status" so the outcome of the app's central action is announced, not just
          drawn — a screen-reader user used to get no feedback at all from a paste. */}
      <div role="status" aria-live="polite" className="mt-2.5 empty:mt-0">
        {pasteError && <p className="text-[12.5px] text-danger">{pasteError}</p>}
        {receipt && !pasteError && (
          <p className="text-[12.5px] leading-relaxed text-ink-soft">
            {receipt.parsed.isEmpty ? (
              "Nothing recognised in that text. Check you copied the message itself, not just the timestamp."
            ) : receipt.parsed.isCompleteBoardReading ? (
              <>
                <span className="font-medium text-ink">Whole board reading:</span>{" "}
                {summarise(receipt)}.
              </>
            ) : (
              <>
                <span className="font-medium text-ink">Added {summarise(receipt)}.</span> Nothing
                was ruled out: no world board reading in that text, and only the board lists what
                is not running.
              </>
            )}
          </p>
        )}
      </div>

      {unresolvedCount > 0 && (
        <button
          type="button"
          onClick={onJumpToUnresolved}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-md border border-gold-line bg-gold-tint px-2.5 py-1.5 text-[12.5px] font-medium text-gold transition-colors hover:bg-[hsl(var(--gold-bright)/0.32)]"
        >
          Fill in {countPhrase(unresolvedCount, "remaining fact")}
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
