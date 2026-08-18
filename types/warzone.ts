export interface WarzoneExecution {
  executionId: number;
  scheduleTime: string;
  warzoneSequence: string;
}

export type WarzoneHealthMark = "healthy" | "inconclusive" | "degraded" | "unknown";

export interface WarzoneSchedule {
  world: string;
  timezone: string | null;
  tracksWarzoneService: boolean;
  mark: WarzoneHealthMark;
  executions: WarzoneExecution[];
  tibiaCoin: {
    supplyPrice: number | null;
    demandPrice: number | null;
    midPrice: number | null;
  } | null;
}
