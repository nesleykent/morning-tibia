"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DromeRotationInfo } from "@/types/drome";
import { formatShortDateInZone, formatTimeInZone } from "@/lib/formatter/dateFormat";

export function DromeCard({ drome }: { drome: DromeRotationInfo | null }) {
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const endsAtDate = drome?.endsAt ? new Date(drome.endsAt) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span aria-hidden="true">🏛️</span> Tibia Drome
        </CardTitle>
        <CardDescription>
          Fixed bi-weekly rotation, from{" "}
          <a
            href="https://tibia.fandom.com/wiki/Tibiadrome/Rotation"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            TibiaWiki
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {drome?.rotationNumber ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">Rotation {drome.rotationNumber}</Badge>
            {endsAtDate && (
              <span className="text-xs text-muted-foreground">
                Ends {formatShortDateInZone(endsAtDate, viewerTimeZone)} at{" "}
                {formatTimeInZone(endsAtDate, viewerTimeZone)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Rotation info unavailable right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
