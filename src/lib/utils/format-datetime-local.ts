/**
 * Formats a Date object to the format expected by HTML datetime-local input
 * Format: YYYY-MM-DDTHH:mm
 * @param date - The date to format
 * @returns Formatted datetime string for datetime-local input
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local string to ISO 8601 format with timezone
 * Assumes the input is in the user's local timezone and appends Z for UTC representation
 * @param datetimeLocal - Datetime string in format YYYY-MM-DDTHH:mm (from datetime-local input)
 * @returns ISO 8601 formatted datetime string (YYYY-MM-DDTHH:mm:00Z)
 */
export function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal) {
    return "";
  }
  return `${datetimeLocal}:00Z`;
}
