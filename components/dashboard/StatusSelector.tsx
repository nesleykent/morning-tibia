"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MiniWorldChangeState } from "@/types/miniWorldChange";

const OPTIONS: { value: MiniWorldChangeState; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface StatusSelectorProps {
  value: MiniWorldChangeState;
  onChange: (value: MiniWorldChangeState) => void;
}

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MiniWorldChangeState)}>
      <SelectTrigger aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
