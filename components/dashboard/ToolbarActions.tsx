"use client";

import { useState } from "react";
import { RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ToolbarActionsProps {
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
}

export function ToolbarActions({ onRefresh, onReset, isRefreshing }: ToolbarActionsProps) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
        Refresh data
      </Button>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <RotateCcw />
            Reset
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset today&apos;s briefing?</DialogTitle>
            <DialogDescription>
              This clears every manual edit for this world and date — mini world changes,
              merchants, prices, and events — back to their defaults. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onReset();
                setResetOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
