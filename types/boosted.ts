export type BoostedKind = "creature" | "boss";

export interface BoostedEntity {
  kind: BoostedKind;
  name: string;
  imageUrl: string | null;
}
