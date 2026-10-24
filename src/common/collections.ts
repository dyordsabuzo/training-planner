// Dependency-free (no Firebase client), so Node scripts can import it too.

export enum SourceDbReferences {
  EXERCISES = "exercises",
  SUPERSETS = "supersets",
  SESSIONS = "sessions",
  PLANS = "plans",
  USERDATA = "userdata",
}

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",") : [];
