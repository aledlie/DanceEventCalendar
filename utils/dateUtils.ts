/**
 * Parses a "YYYY-MM-DD" string into a Date object, avoiding timezone issues.
 * Returns null if the date string is invalid.
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.warn(`Invalid or non-YYYY-MM-DD date string encountered: ${dateStr}`);
    return null;
  }
  // By appending T00:00:00, we treat the date as local time,
  // preventing it from shifting based on the user's timezone relative to UTC.
  const date = new Date(`${dateStr}T00:00:00`);
  
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string after parsing: ${dateStr}`);
    return null;
  }
  return date;
};
/**
* Formats an array of "YYYY-MM-DD" date strings into a human-readable range.
* e.g., ["2024-08-15"] -> "Aug 15, 2024"
* e.g., ["2024-08-15", "2024-08-18"] -> "Aug 15 - 18, 2024"
* e.g., ["2024-12-28", "2025-01-02"] -> "Dec 28, 2024 - Jan 2, 2025"
*/
export const formatDateRange = (dates: string[]): string => {
  if (!dates || dates.length === 0) return 'Date not available';

  const start = parseDate(dates[0]);
  const end = parseDate(dates[dates.length - 1]);

  if (!start) return 'Invalid date';

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startYear = start.getFullYear();
  const endYear = end ? end.getFullYear() : startYear;

  const startFormatted = start.toLocaleDateString('en-US', { ...options, year: (startYear !== endYear) ? 'numeric' : undefined });

  if (!end || start.getTime() === end.getTime()) {
      return start.toLocaleDateString('en-US', { ...options, year: 'numeric' });
  }

  const endFormatted = end.toLocaleDateString('en-US', { ...options, year: 'numeric' });

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.getDate()}, ${startYear}`;
  }

  return `${startFormatted} - ${endFormatted}`;
};
