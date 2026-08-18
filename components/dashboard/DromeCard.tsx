"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DromeRotation, DromeStatus } from "@/types/drome";

interface DromeCardProps {
  drome: DromeRotation;
  onChange: (patch: Partial<DromeRotation>) => void;
}

const STATUS_OPTIONS: { value: DromeStatus; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export function DromeCard({ drome, onChange }: DromeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">🏛️</span> Tibia Drome
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select value={drome.status} onValueChange={(value) => onChange({ status: value as DromeStatus })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="drome-rotation">Rotation</Label>
          <Input
            id="drome-rotation"
            placeholder="e.g. Rotation B"
            value={drome.rotationLabel}
            onChange={(e) => onChange({ rotationLabel: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="drome-notes">Notes</Label>
          <Textarea
            id="drome-notes"
            placeholder="Anything worth calling out…"
            value={drome.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
