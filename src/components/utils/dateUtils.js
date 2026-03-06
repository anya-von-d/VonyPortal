/**
 * Consistent date utility for VonyPortal.
 *
 * All date math uses the user's LOCAL time (from their computer).
 * Dates stored as ISO strings (e.g. "2025-03-15") are parsed as local
 * midnight so they don't shift across time zones.
 */

/**
 * Parse a date string or Date into a local-midnight Date.
 * Handles:
 *  - "2025-03-15"            → local Mar 15
 *  - "2025-03-15T00:00:00Z"  → local Mar 15 (strips UTC offset)
 *  - Date objects             → cloned and zeroed to local midnight
 */
export function toLocalDate(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    // If it's a date-only string like "2025-03-15", parse as local
    const dateOnly = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
      return new Date(
        parseInt(dateOnly[1]),
        parseInt(dateOnly[2]) - 1,
        parseInt(dateOnly[3])
      );
    }
  }
  // For Date objects or full ISO strings, clone and zero to local midnight
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get today's date at local midnight.
 */
export function getLocalToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Calculate the number of whole days between two dates (a - b).
 * Positive = a is in the future relative to b.
 * Both dates are normalised to local midnight first.
 */
export function daysBetween(a, b) {
  const da = toLocalDate(a);
  const db = toLocalDate(b);
  if (!da || !db) return null;
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}

/**
 * Days until a given date from today.
 * Positive = in the future, negative = overdue, 0 = today.
 */
export function daysUntil(date) {
  return daysBetween(date, getLocalToday());
}

/**
 * Whether a date is in the past (before today).
 */
export function isPastDate(date) {
  const d = daysUntil(date);
  return d !== null && d < 0;
}
