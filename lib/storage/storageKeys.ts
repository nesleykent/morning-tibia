const NAMESPACE = "morning-tibia:v1";

export const storageKeys = {
  lastWorld: `${NAMESPACE}:lastWorld`,
  preferredFormat: `${NAMESPACE}:preferredFormat`,
  briefingLanguage: `${NAMESPACE}:briefingLanguage`,
  upcomingEventsWindowDays: `${NAMESPACE}:upcomingEventsWindowDays`,
  viewerTimeZoneOverride: `${NAMESPACE}:viewerTimeZoneOverride`,
  overrides: (world: string, dateKey: string) => `${NAMESPACE}:overrides:${world}:${dateKey}`,
};
