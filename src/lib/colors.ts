// Same palette as tags, reused to give each person a stable color in the timeline.
export const personColors = ["#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#64748b"] as const;

export function getPersonColor(personId: number) {
  return personColors[personId % personColors.length];
}
