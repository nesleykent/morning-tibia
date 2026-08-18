const NAMESPACE = "morning-tibia:v1";

export const storageKeys = {
  lastWorld: `${NAMESPACE}:lastWorld`,
  preferredFormat: `${NAMESPACE}:preferredFormat`,
  overrides: (world: string, dateKey: string) => `${NAMESPACE}:overrides:${world}:${dateKey}`,
};
