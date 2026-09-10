import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      // `appearance-none` matters on WebKit, which otherwise draws its own inset border
      // and rounding over a styled textarea.
      "thin-scroll flex min-h-16 w-full appearance-none rounded-md border border-line bg-sunken px-3 py-2 text-[13px] text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus-visible:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
