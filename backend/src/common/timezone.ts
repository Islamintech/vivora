// Client-supplied IANA timezone names go straight into MongoDB's
// $dateToString, which errors the whole aggregation on an unknown zone —
// so validate via Intl first and quietly fall back to UTC.
export function safeTimezone(tz?: string | null): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}
