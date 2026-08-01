import { safeTimezone } from '../../libs/timezone';

export interface OpeningHours {
  openingTime?: string;
  closingTime?: string;
  alwaysOpen?: boolean;
  timezone?: string;
}

/** "HH:mm" -> minutes since midnight; null if malformed. */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Current wall-clock minutes since midnight in the given IANA zone. */
function nowMinutesIn(timezone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTimezone(timezone),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const min = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return (h % 24) * 60 + min;
}

/**
 * Whether the restaurant is currently within its opening hours.
 * Unset or malformed hours are treated as open, so a restaurant can never be
 * locked out of taking orders by bad configuration.
 */
export function isOpenNow(r: OpeningHours, now = new Date()): boolean {
  if (r.alwaysOpen) return true;
  const open = toMinutes(r.openingTime);
  const close = toMinutes(r.closingTime);
  if (open === null || close === null) return true;
  if (open === close) return true; // same time both ends = open all day

  const cur = nowMinutesIn(r.timezone ?? 'UTC', now);
  return close > open
    ? cur >= open && cur < close // same-day shift
    : cur >= open || cur < close; // shift crosses midnight
}
