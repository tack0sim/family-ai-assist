/**
 * Resolves the base URL for the application.
 *
 * Environment-aware priority chain:
 * - Local development: Always uses http://localhost:3000
 * - Vercel deployments:
 *   1. x-forwarded-host header (custom domain)
 *   2. VERCEL_URL environment variable (auto-generated domain)
 * - Other deployments:
 *   1. NEXT_PUBLIC_BASE_URL environment variable
 *   2. origin header (fallback)
 *
 * The returned URL is normalized (trailing slashes removed) and validated
 * to have a protocol (http:// or https://).
 *
 * @param headers - Request headers containing x-forwarded-host and origin
 * @returns The base URL as a normalized string (e.g., "https://example.com")
 * @throws Error with actionable message if unable to resolve base URL
 */
export function getBaseURL(
  headers: Headers | HeadersInit | { get(name: string): string | null }
): string {
  // Normalize headers to a callable interface (handles Headers object, plain objects, etc)
  const getHeader = (name: string): string | null => {
    if (headers && typeof (headers as any).get === "function") {
      return (headers as any).get(name);
    }
    if (headers && typeof headers === "object" && name in headers) {
      return (headers as Record<string, string>)[name] || null;
    }
    return null;
  };

  // Environment detection
  const isVercelDeployment =
    typeof process !== "undefined" && !!process.env.VERCEL;
  const isDevelopment =
    typeof process !== "undefined" && process.env.NODE_ENV === "development";

  // Local development: always use localhost
  // This prevents NEXT_PUBLIC_BASE_URL from redirecting local OAuth to production
  if (isDevelopment && !isVercelDeployment) {
    return "http://localhost:3000";
  }

  // Vercel deployments: prioritize custom domain or auto-generated URL
  if (isVercelDeployment) {
    const forwardedHost = getHeader("x-forwarded-host");
    if (forwardedHost) {
      return normalizeUrl(`https://${forwardedHost}`);
    }

    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      return normalizeUrl(`https://${vercelUrl}`);
    }
  }

  // Other deployments: use explicit config or origin header
  const publicBaseUrl =
    typeof process === "undefined"
      ? undefined
      : process.env.NEXT_PUBLIC_BASE_URL;
  if (publicBaseUrl) {
    return normalizeUrl(publicBaseUrl);
  }

  const origin = getHeader("origin");
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
