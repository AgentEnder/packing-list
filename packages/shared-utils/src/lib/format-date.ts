import { parseISO, format } from 'date-fns';

/**
 * Format an ISO date string in a timezone-agnostic way.
 *
 * @param iso ISO date string in `yyyy-MM-dd` format
 * @param dateFormat Output format, defaults to `MMM d, yyyy`
 */
export function formatDate(iso: string, dateFormat = 'MMM d, yyyy'): string {
  const date = parseISO(iso);
  return format(date, dateFormat);
}
