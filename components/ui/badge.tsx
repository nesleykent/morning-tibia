import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        active: "border-transparent bg-status-active/15 text-status-active",
        inactive: "border-transparent bg-status-inactive/15 text-status-inactive",
        stage1: "border-transparent bg-status-stage1/15 text-status-stage1",
        stage2: "border-transparent bg-status-stage2/15 text-status-stage2",
        stage3: "border-transparent bg-status-stage3/15 text-status-stage3",
        unknown: "border-transparent bg-status-unknown/20 text-muted-foreground",
        gold: "border-transparent bg-gold/15 text-gold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
