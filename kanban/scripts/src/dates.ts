export function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function compareIsoTimestamps(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right);
}

export function newestTimestamp(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }
  return values.slice().sort(compareIsoTimestamps).at(-1) ?? null;
}

export function daysBetween(earlier: string, later: string): number {
  const diffMs = Date.parse(later) - Date.parse(earlier);
  return Math.floor(diffMs / 86_400_000);
}

export function formatTimestamp(value: string): string {
  return value.replace("T", " ").replace(":00Z", "Z");
}

export function normalizeIsoTimestamp(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  if (typeof value === "string") {
    return value.replace(/\.\d{3}Z$/, "Z");
  }
  return value;
}
