import { getBaseURL } from "./get-base-url";

describe("getBaseURL", () => {
  // Helper to create mock Headers
  const createHeaders = (entries: Record<string, string>): Headers => {
    const headers = new Headers();
    Object.entries(entries).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  };

  // Save original env vars
  const originalEnv = process.env;

  afterEach(() => {
    // Restore env vars
    process.env = originalEnv;
  });

  describe("x-forwarded-host header (highest priority)", () => {
    test("returns URL from x-forwarded-host header", () => {
      const headers = createHeaders({
        "x-forwarded-host": "example.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });

    test("prefers x-forwarded-host over VERCEL_URL", () => {
      process.env.VERCEL_URL = "vercel-auto-domain.vercel.app";

      const headers = createHeaders({
        "x-forwarded-host": "example.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });

    test("removes trailing slash from x-forwarded-host", () => {
      const headers = createHeaders({
        "x-forwarded-host": "example.com/",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });
  });

  describe("VERCEL_URL environment variable", () => {
    test("returns URL from VERCEL_URL when x-forwarded-host missing", () => {
      process.env.VERCEL_URL = "my-app.vercel.app";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app.vercel.app");
    });

    test("removes trailing slash from VERCEL_URL", () => {
      process.env.VERCEL_URL = "my-app.vercel.app/";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app.vercel.app");
    });

    test("prefers VERCEL_URL over NEXT_PUBLIC_BASE_URL", () => {
      process.env.VERCEL_URL = "my-app.vercel.app";
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app.vercel.app");
    });
  });

  describe("NEXT_PUBLIC_BASE_URL environment variable", () => {
    test("returns URL from NEXT_PUBLIC_BASE_URL when higher priority vars missing", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://explicit.com");
    });

    test("removes trailing slash from NEXT_PUBLIC_BASE_URL", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com/";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://explicit.com");
    });

    test("accepts http:// in NEXT_PUBLIC_BASE_URL", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("prefers NEXT_PUBLIC_BASE_URL over origin header", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://explicit.com");
    });
  });

  describe("origin header fallback", () => {
    test("returns URL from origin header when higher priority vars missing", () => {
      const headers = createHeaders({
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://origin.com");
    });

    test("removes trailing slash from origin header", () => {
      const headers = createHeaders({
        origin: "https://origin.com/",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://origin.com");
    });
  });

  describe("error handling", () => {
    test("throws error when all fallbacks fail", () => {
      const headers = createHeaders({});

      expect(() => getBaseURL(headers)).toThrow(
        "Unable to resolve base URL. Ensure NEXT_PUBLIC_BASE_URL is set"
      );
    });

    test("throws error when URL lacks protocol", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "example.com";

      const headers = createHeaders({});

      expect(() => getBaseURL(headers)).toThrow(
        "must start with http:// or https://"
      );
    });

    test("throws error when x-forwarded-host lacks protocol", () => {
      const headers = createHeaders({
        "x-forwarded-host": "example.com", // Missing https://
      });

      expect(() => getBaseURL(headers)).toThrow(
        "must start with http:// or https://"
      );
    });
  });

  describe("URL normalization", () => {
    test("removes single trailing slash", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com/";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });

    test("removes multiple trailing slashes", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com///";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com//");
    });

    test("preserves path in URL", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://example.com/app";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com/app");
    });

    test("preserves port in URL", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("preserves subdomain in URL", () => {
      process.env.NEXT_PUBLIC_BASE_URL = "https://api.example.com";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://api.example.com");
    });
  });

  describe("priority order verification", () => {
    test("priority: x-forwarded-host > VERCEL_URL > NEXT_PUBLIC_BASE_URL > origin", () => {
      process.env.VERCEL_URL = "vercel.app";
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({
        "x-forwarded-host": "custom.com",
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://custom.com");
    });
  });
});
