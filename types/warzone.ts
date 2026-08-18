export interface WarzoneExecution {
  executionId: number;
  scheduleTime: string;
  warzoneSequence: string;
}

export type WarzoneHealthMark = "healthy" | "inconclusive" | "degraded" | "unknown";

export interface WarzoneSchedule {
  world: string;
  /** IANA timezone the schedule_time values are in, e.g. "America/Sao_Paulo". */
  timezone: string | null;
  tracksWarzoneService: boolean;
  mark: WarzoneHealthMark;
  executions: WarzoneExecution[];
}
