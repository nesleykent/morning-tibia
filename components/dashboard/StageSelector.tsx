"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MiniWorldChangeState } from "@/types/miniWorldChange";

const OPTIONS: { value: MiniWorldChangeState; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "inactive", label: "Inactive" },
  { value: "stage1", label: "Stage 1" },
  { value: "stage2", label: "Stage 2" },
  { value: "stage3", label: "Stage 3" },
];

interface StageSelectorProps {
  value: MiniWorldChangeState;
  onChange: (value: MiniWorldChangeState) => void;
}

export function StageSelector({ value, onChange }: StageSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MiniWorldChangeState)}>
      <SelectTrigger aria-label="Stage">
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
