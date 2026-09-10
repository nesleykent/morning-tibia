import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The searchable list behind the world selector.
 *
 * Deliberately free of `overflow: hidden` on the root: the surrounding popover owns the
 * rounding, and a rounded overflow clip on a portalled, transformed element is exactly the
 * combination that makes WebKit drop or smear the first paint of a dropdown. The list itself
 * is the only scroll container, and it carries its own `overscroll-behavior` so a flick inside
 * the menu never scrolls the dispatch behind it.
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("flex h-full w-full flex-col bg-surface text-ink", className)}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-line px-2.5 transition-colors focus-within:border-gold-line">
    <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        // `appearance-none` and an explicit background: WebKit otherwise paints its own
        // inset field chrome over a transparent input inside a popover.
        // Radix focuses this the instant the panel opens, so the global focus ring would
        // fire on every open and read as a rendering fault. The container's rule above is
        // the focus indication; this is never focused without the panel being visible.
        "flex h-9 w-full appearance-none rounded-none border-0 bg-transparent py-2 text-[13px] text-ink outline-none focus-visible:outline-none placeholder:text-ink-faint disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "thin-scroll max-h-[17rem] overflow-y-auto overflow-x-hidden overscroll-contain p-1",
      className,
    )}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="px-3 py-6 text-center text-[13px] text-ink-faint"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "text-ink [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-ink-faint",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-soft outline-none transition-colors",
      // cmdk drives the highlight from keyboard *and* pointer, so a hover rule of our own
      // would fight it. One selector, both inputs.
      "data-[selected=true]:bg-accent data-[selected=true]:text-ink",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
