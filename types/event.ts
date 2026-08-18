export interface ActiveEvent {
  id: string;
  title: string;
  bonus: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startDate: string | null;
  note: string;
}
