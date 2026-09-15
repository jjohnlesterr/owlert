/**
 * ISO timestamp `daysAgo` days before now — the cutoff for the "recent
 * history" window. Kept as a plain helper (not called inline in a
 * component body) since `Date.now()` is flagged as an impure call by the
 * react-hooks/purity lint rule when used directly inside a component.
 */
export function historyWindowStart(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}
