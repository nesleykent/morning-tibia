/** Reduced HTML matching Tibia.com's calendar observed on 2026-09-12.
 * The grid, tooltip pairs, seasonal icons and boundary markers retain the source
 * structure; unrelated styles, navigation, adverts and scripts are omitted. */
export interface FixtureEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
  seasonal?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function calendarFixture(year: number, month: number, events: FixtureEvent[] = []): string {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = first.getTime() - ((first.getUTCDay() + 6) % 7) * 86_400_000;
  const header = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart + index * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    const visible = events.filter((event) => event.start <= key && event.end >= key);
    function helper(group: FixtureEvent[], seasonal: boolean): string {
      if (group.length === 0) return "";
      const tooltip = group.map((event) => `<div style = "font-size: 12pt; font-weight: bold; word-break: break-word;">${escapeHtml(event.title)}:</div><div style = "margin-bottom: 20px;">&bull; ${escapeHtml(event.description ?? "Official description.")}</div>`).join("");
      const handler = `ActivateHelperDiv($(this), '', '${tooltip.replace(/'/g, "\\'")}', '');`;
      const content = seasonal
        ? '<img src="https://static.tibia.com/images/global/content/icon-seasonal.png">'
        : group.map((event) => `<div style="background:#7a1b34">${event.start === key || event.end === key ? "*" : ""}${escapeHtml(event.title)}</div>`).join("");
      return `<span class="HelperDivIndicator" onmouseover="${escapeHtml(handler)}">${content}</span>`;
    }
    return `<td><div><span>${date.getUTCDate()} </span>${helper(visible.filter((event) => event.seasonal), true)}</div>${helper(visible.filter((event) => !event.seasonal), false)}</td>`;
  });
  const rows = Array.from({ length: 6 }, (_, row) => `<tr>${days.slice(row * 7, row * 7 + 7).join("")}</tr>`).join("");
  return `<div class="eventscheduleheaderdateblock"><span>«</span>${header}<span>»</span></div><table id="eventscheduletable"><tr><th>Monday</th></tr>${rows}</table>`;
}

// Periods and wording verified directly against September/October 2026 on Tibia.com.
export const OFFICIAL_AUTUMN_EVENTS: FixtureEvent[] = [
  { title: "Rise of Devovorga", start: "2026-09-01", end: "2026-09-07", description: "A powerful ancient weapon meant to be sleeping forever has awoken deep under Vengoth. With thirst for revenge and burning rage she will destroy the world - unless you fight her back." },
  { title: "XP/Skill Event", start: "2026-09-04", end: "2026-09-07", description: "XP/Skill Event! Gain more experience and skill points by killing monsters, through offline training or with exercise weapons." },
  { title: "Full Moon", start: "2026-09-12", end: "2026-09-15", description: "The moon is full! Beware, lycanthropic creatures like werewolves, werefoxes or werebears roam the lands now. And they are more aggressive and numerous than usual." },
  { title: "Colours of Magic", start: "2026-09-15", end: "2026-09-23", description: "Mysterious letters with coloured powders can now be found everywhere. Choose your wizard and make your friends join your cause - what is your true colour?" },
  { title: "Annual Autumn Vintage", start: "2026-10-01", end: "2026-10-08" },
  { title: "Exaltation Overload", start: "2026-10-02", end: "2026-10-05", description: "Fight with the powers of the Exaltation Forge against dangerous influenced and fiendish monsters." },
  { title: "Orcsoberfest", start: "2026-10-09", end: "2026-10-16", description: "Join the Orgers in traditional festivities of fun and feast to earn their respect and tasty rewards!" },
  { title: "Full Moon", start: "2026-10-12", end: "2026-10-15" },
  { title: "Annual Autumn Vintage", start: "2026-10-17", end: "2026-10-24" },
  { title: "Halloween Event", start: "2026-10-31", end: "2026-11-03" },
];
