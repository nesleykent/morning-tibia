"use client";

import { useId, useRef, useState } from "react";
import { ClipboardPaste, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
 * How evidence enters the dispatch.
 *
 * Not an "Import section" — pasting is an action, not a place, so it is a single field beneath
 * the page it fills. It is also the app's only input surface, which is why it now carries a
 * real label and a sentence of explanation rather than a placeholder that disappears on the
 * first keystroke: a reader who does not already know what the World Board is could not
 * previously find out from this screen.
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
}: {
  onApply: (parsed: CombinedParseResult) => void;
  onUndo: () => void;
  canUndo: boolean;
  hasEvidence: boolean;
  /** How many blanks the dispatch still has open, after whatever the paste settled. */
  unresolvedCount: number;
  onJumpToUnresolved: () => void;
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
    <section className="mt-8" aria-labelledby={`${fieldId}-label`}>
      <h2
        id={`${fieldId}-label`}
        className="text-[13px] font-semibold text-[hsl(var(--foreground))]"
      >
        Paste what the game told you
      </h2>
      <p id={hintId} className="mt-1 text-[12.5px] leading-relaxed text-[hsl(var(--muted-foreground))]">
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
        rows={hasEvidence ? 3 : 5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="This board will notify you of currently active mini world changes all over Tibia…"
        className="mt-2.5 resize-y border-white/10 bg-white/[0.03] font-mono text-[13px] leading-relaxed text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/70"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button type="button" onClick={apply} disabled={!text.trim()}>
          Add to today
        </Button>
        {canPasteFromClipboard && (
          <Button type="button" variant="outline" onClick={pasteFromClipboard}>
            <ClipboardPaste className="h-4 w-4" /> Paste from clipboard
          </Button>
        )}
        <span className="hidden text-[11.5px] text-[hsl(var(--muted-foreground))]/70 sm:inline">
          ⌘/Ctrl + Enter
        </span>
        {canUndo && (
          <Button type="button" variant="ghost" onClick={onUndo}>
            <Undo2 className="h-4 w-4" /> Undo last paste
          </Button>
        )}
      </div>

      {/* role="status" so the outcome of the app's central action is announced, not just
          drawn — a screen-reader user used to get no feedback at all from a paste. */}
      <div role="status" aria-live="polite" className="mt-2 empty:mt-0">
        {pasteError && (
          <p className="text-[12.5px] text-[hsl(var(--danger))]">{pasteError}</p>
        )}
        {receipt && !pasteError && (
          <p className="text-[12.5px] text-[hsl(var(--muted-foreground))]">
            {receipt.parsed.isEmpty ? (
              "Nothing recognised in that text. Check you copied the message itself, not just the timestamp."
            ) : receipt.parsed.isCompleteBoardReading ? (
              <>Whole board reading: {summarise(receipt)}.</>
            ) : (
              <>
                Added {summarise(receipt)}. Nothing was ruled out: no world board reading in
                that text, and only the board lists what is not running.
              </>
            )}
          </p>
        )}
      </div>

      {unresolvedCount > 0 && (
        <button
          type="button"
          onClick={onJumpToUnresolved}
          className="mt-2 text-[12.5px] font-medium text-[hsl(var(--gold))] underline-offset-4 hover:underline"
        >
          Fill in {countPhrase(unresolvedCount, "remaining fact")} →
        </button>
      )}
    </section>
  );
}
