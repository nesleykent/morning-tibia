"use client";

import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface CopyButtonProps extends Pick<ButtonProps, "variant" | "size" | "className"> {
  text: string;
  label: string;
  copiedLabel?: string;
}

export function CopyButton({ text, label, copiedLabel = "Copied!", ...buttonProps }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button type="button" onClick={() => copy(text)} {...buttonProps}>
      {copied ? <Check /> : <Copy />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
