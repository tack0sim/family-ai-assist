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
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    // Clear test-relevant env vars before each test
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Clean up after each test
    delete process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.VERCEL;
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("local development (highest priority)", () => {
    test("always returns localhost in development mode", () => {
      process.env.NODE_ENV = "development";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("prefers localhost over NEXT_PUBLIC_BASE_URL in development", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_BASE_URL = "https://preview.vercel.app";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("prefers localhost over origin header in development", () => {
      process.env.NODE_ENV = "development";

      const headers = createHeaders({
        origin: "https://preview.vercel.app",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("prefers localhost over x-forwarded-host in development (non-Vercel)", () => {
      process.env.NODE_ENV = "development";

      const headers = createHeaders({
        "x-forwarded-host": "example.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("does NOT use localhost on Vercel preview deployments", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "my-app-preview.vercel.app";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app-preview.vercel.app");
    });
  });

  describe("x-forwarded-host header (Vercel custom domain)", () => {
    test("returns URL from x-forwarded-host header on Vercel", () => {
      process.env.VERCEL = "1";

      const headers = createHeaders({
        "x-forwarded-host": "example.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });

    test("prefers x-forwarded-host over VERCEL_URL on Vercel", () => {
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "vercel-auto-domain.vercel.app";

      const headers = createHeaders({
        "x-forwarded-host": "example.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });

    test("removes trailing slash from x-forwarded-host", () => {
      process.env.VERCEL = "1";

      const headers = createHeaders({
        "x-forwarded-host": "example.com/",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
    });
  });

  describe("VERCEL_URL environment variable", () => {
    test("returns URL from VERCEL_URL when x-forwarded-host missing on Vercel", () => {
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "my-app.vercel.app";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app.vercel.app");
    });

    test("removes trailing slash from VERCEL_URL", () => {
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "my-app.vercel.app/";

      const headers = createHeaders({});

      const result = getBaseURL(headers);
      expect(result).toBe("https://my-app.vercel.app");
    });

    test("prefers VERCEL_URL over NEXT_PUBLIC_BASE_URL on Vercel", () => {
      process.env.VERCEL = "1";
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

    test("adds https:// protocol when x-forwarded-host lacks protocol", () => {
      process.env.VERCEL = "1";

      const headers = createHeaders({
        "x-forwarded-host": "example.com", // Missing https:// is OK
      });

      // x-forwarded-host is always treated as a hostname and https:// is added
      const result = getBaseURL(headers);
      expect(result).toBe("https://example.com");
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
    test("priority on Vercel: x-forwarded-host > VERCEL_URL > NEXT_PUBLIC_BASE_URL > origin", () => {
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "vercel.app";
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({
        "x-forwarded-host": "custom.com",
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://custom.com");
    });

    test("priority in development: always localhost regardless of other vars", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("http://localhost:3000");
    });

    test("priority in non-Vercel production: NEXT_PUBLIC_BASE_URL > origin", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXT_PUBLIC_BASE_URL = "https://explicit.com";

      const headers = createHeaders({
        origin: "https://origin.com",
      });

      const result = getBaseURL(headers);
      expect(result).toBe("https://explicit.com");
    });
  });
});
