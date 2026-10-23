export const RELATIONSHIP_TYPES = ["love", "friendship", "family"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export const RELATIONSHIPS: Record<
  RelationshipType,
  { label: string; color: string; description: string }
> = {
  love: { label: "Amore", color: "#f39ac2", description: "amore" },
  friendship: { label: "Amicizia", color: "#79b8f2", description: "amicizia" },
  family: {
    label: "Sangue / famiglia",
    color: "#e5574f",
    description: "sangue (famiglia)",
  },
};
