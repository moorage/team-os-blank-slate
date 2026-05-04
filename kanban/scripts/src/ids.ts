export function compareCardIds(left: string, right: string): number {
  return left.localeCompare(right, "en", { numeric: true });
}

export function normalizeCardId(value: string): string {
  return value.trim().toUpperCase();
}
