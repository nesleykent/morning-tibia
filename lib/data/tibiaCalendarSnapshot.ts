import type { OfficialCalendarEvent } from "@/types/event";
import { getNextServerSave } from "@/lib/utils/serverSave";
import { calendarMonthUrl } from "./tibiaCalendarMapping";

/**
 * Last verified official calendar periods kept with the application so a
 * temporary Tibia.com bot challenge cannot replace official data with Wiki
 * estimates. The scheduled fetch remains the primary source and refreshes
 * this window whenever the official endpoint is available.
 */
const VERIFIED_PERIODS = [
  ["Rise of Devovorga", "2026-09-01", "2026-09-07", "A powerful ancient weapon meant to be sleeping forever has awoken deep under Vengoth. With thirst for revenge and burning rage she will destroy the world - unless you fight her back."],
  ["XP/Skill Event", "2026-09-04", "2026-09-07", "XP/Skill Event! Gain more experience and skill points by killing monsters, through offline training or with exercise weapons."],
  ["Full Moon", "2026-09-12", "2026-09-15", "The moon is full! Beware, lycanthropic creatures like werewolves, werefoxes or werebears roam the lands now. And they are more aggressive and numerous than usual."],
  ["Colours of Magic", "2026-09-15", "2026-09-23", "Mysterious letters with coloured powders can now be found everywhere. Choose your wizard and make your friends join your cause - what is your true colour?"],
  ["Annual Autumn Vintage", "2026-10-01", "2026-10-08", null],
  ["Exaltation Overload", "2026-10-02", "2026-10-05", "Fight with the powers of the Exaltation Forge against dangerous influenced and fiendish monsters."],
  ["Orcsoberfest", "2026-10-09", "2026-10-16", "Join the Orgers in traditional festivities of fun and feast to earn their respect and tasty rewards!"],
  ["Full Moon", "2026-10-12", "2026-10-15", null],
  ["Annual Autumn Vintage", "2026-10-17", "2026-10-24", null],
  ["Halloween Event", "2026-10-31", "2026-11-03", null],
] as const;

function saveForDateKey(dateKey: string): string {
  return getNextServerSave(new Date(`${dateKey}T06:00:00Z`)).toISOString();
}

const SNAPSHOT_EVENTS: OfficialCalendarEvent[] = VERIFIED_PERIODS.map(([title, start, end, description]) => ({
  id: `tibia-${encodeURIComponent(title)}-${start}`,
  title,
  description,
  startAt: saveForDateKey(start),
  endAt: saveForDateKey(end),
  url: calendarMonthUrl(Number(start.slice(0, 4)), Number(start.slice(5, 7))),
  source: "tibia.com",
}));

export function getOfficialCalendarSnapshot(referenceDate: Date): OfficialCalendarEvent[] {
  return SNAPSHOT_EVENTS.filter((event) => Date.parse(event.endAt) > referenceDate.getTime());
}
