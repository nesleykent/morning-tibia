import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The page's structural unit, replacing "everything lives in a Card".
 *
 * Hierarchy comes from a small letterspaced eyebrow, a real heading, and vertical rhythm —
 * not from another border. Most sections sit directly on the page background; a card is
 * reserved for things that genuinely are a discrete object (the briefing sheet, a note).
 */
export function Section({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  id,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-3", className)}>
      {(eyebrow || title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1.5">
          <div className="min-w-0">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <h2 className="mt-1 text-balance text-lg font-medium leading-tight tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small, letterspaced, muted label. The workhorse for naming a group without a heading. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * A quiet aside for provenance and caveats — why something can't be known, what a source
 * can't tell you. Deliberately low-contrast: it explains, it doesn't alarm.
 */
export function Note({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-muted/40 px-3 py-2.5", className)}>
      {label && <Eyebrow className="mb-1">{label}</Eyebrow>}
      <div className="text-[12.5px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

/** A horizontal rule used to separate major page regions without drawing a box. */
export function SectionDivider({ className }: { className?: string }) {
  return <hr className={cn("border-t border-border/60", className)} />;
}
