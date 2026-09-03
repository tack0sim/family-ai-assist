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
 * Converts a datetime-local string to ISO 8601 format (UTC)
 * Takes the user's local time and converts it to actual UTC.
 * The Date constructor interprets (year, month, day, hour, min, sec) as local time,
 * so using getUTC* methods on it gives us the equivalent UTC time.
 * @param datetimeLocal - Datetime string in format YYYY-MM-DDTHH:mm (from datetime-local input)
 * @returns ISO 8601 formatted datetime string in UTC (YYYY-MM-DDTHH:mm:ssZ)
 */
export function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal) {
    return "";
  }

  // Parse the datetime-local string
  const parts = datetimeLocal.split("T");
  const [year, month, day] = parts[0].split("-").map(Number);
  const [hours, minutes, ...secondsParts] = parts[1].split(":").map(Number);
  const seconds = secondsParts[0] || 0;

  // Create a Date object with local time values
  // new Date(y, m, d, h, min, s) interprets the input as LOCAL time
  // The internal timestamp represents that local time correctly for this timezone
  // Using getUTC* methods gives us what that time is in UTC
  const localDate = new Date(year, month - 1, day, hours, minutes, seconds);

  // Extract UTC components
  const isoYear = localDate.getUTCFullYear();
  const isoMonth = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const isoDay = String(localDate.getUTCDate()).padStart(2, "0");
  const isoHours = String(localDate.getUTCHours()).padStart(2, "0");
  const isoMinutes = String(localDate.getUTCMinutes()).padStart(2, "0");
  const isoSeconds = String(localDate.getUTCSeconds()).padStart(2, "0");

  return `${isoYear}-${isoMonth}-${isoDay}T${isoHours}:${isoMinutes}:${isoSeconds}Z`;
}
