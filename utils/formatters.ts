/**
 * formatMoney
 * Formats a number into Indonesian Rupiah (IDR) currency format.
 */
export function formatMoney(amount: number | undefined | null | string): string {
  const n = Number(amount ?? 0);
  if (isNaN(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID')}`;
}

/**
 * formatDate
 * Formats a date string into a standard Indonesian date format.
 * Options: 'short' (e.g., 1 Jan 2024), 'long' (e.g., 1 Januari 2024, 12:00)
 */
export function formatDate(dateStr?: string | null, includeTime: boolean = true): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}
