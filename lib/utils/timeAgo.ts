/** Short "X ago" label for a past timestamp (ms since epoch), relative to now. */
export function formatTimeAgo(timestampMs: number, now: number): string {
  const diffSeconds = Math.max(0, Math.round((now - timestampMs) / 1000));
  if (diffSeconds < 60) return "just now";
  const minutes = Math.round(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
