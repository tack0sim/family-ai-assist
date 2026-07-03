/**
 * Resolves the base URL for the application.
 *
 * Priority chain:
 * 1. x-forwarded-host header (Vercel custom domain)
 * 2. VERCEL_URL environment variable (Vercel auto-generated domain)
 * 3. NEXT_PUBLIC_BASE_URL environment variable (explicit config)
 * 4. origin header (browser-sent origin)
 * 5. Throws error if all fail
 *
 * The returned URL is normalized (trailing slashes removed) and validated
 * to have a protocol (http:// or https://).
 *
 * @param headers - Request headers containing x-forwarded-host and origin
 * @returns The base URL as a normalized string (e.g., "https://example.com")
 * @throws Error with actionable message if unable to resolve base URL
 */
export function getBaseURL(headers: Headers): string {
  // Try x-forwarded-host (Vercel custom domain via load balancer)
  const forwardedHost = headers.get("x-forwarded-host");
  if (forwardedHost) {
    return normalizeUrl(`https://${forwardedHost}`);
  }

  // Try VERCEL_URL (Vercel auto-generated domain)
  if (process.env.VERCEL_URL) {
    return normalizeUrl(`https://${process.env.VERCEL_URL}`);
  }

  // Try explicit config (works for any deployment)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_BASE_URL);
  }

  // Try origin header (browser-sent, can be spoofed but better than nothing)
  const origin = headers.get("origin");
  if (origin) {
    return normalizeUrl(origin);
  }

  // All fallbacks exhausted
  throw new Error(
    "Unable to resolve base URL. Ensure NEXT_PUBLIC_BASE_URL is set in environment variables " +
      "for non-Vercel deployments, or configure a custom domain on Vercel."
  );
}

/**
 * Normalizes a URL by:
 * - Removing trailing slashes
 * - Validating it has a protocol (http:// or https://)
 */
function normalizeUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");

  if (!(trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    throw new Error(
      `Invalid base URL: "${trimmed}" must start with http:// or https://`
    );
  }

  return trimmed;
}
