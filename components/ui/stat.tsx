import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * One fact in the morning scan: a small muted label over a value.
 *
 * These sit in a plain flex/grid row rather than each getting a card, which is what let the
 * old overview waste so much space — five cards of wildly different content forced to the
 * same height leaves big empty interiors.
 */
export function Stat({
  label,
  children,
  className,
  emphasis = "normal",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  emphasis?: "normal" | "strong" | "quiet";
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "mt-0.5 truncate",
          emphasis === "strong" && "text-[15px] font-medium text-foreground",
          emphasis === "normal" && "text-[13.5px] text-foreground",
          emphasis === "quiet" && "text-[13px] text-muted-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
