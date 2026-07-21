import { describe, expect, it } from "vitest";
import { validatePasswordComplexity } from "./validate-password";

describe("validatePasswordComplexity", () => {
  it("should accept a valid password", () => {
    const result = validatePasswordComplexity("ValidPass123!");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = validatePasswordComplexity("Pass12!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must be at least 8 characters long"
    );
  });

  it("should reject password without uppercase letter", () => {
    const result = validatePasswordComplexity("validpass123!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one uppercase letter"
    );
  });

  it("should reject password without lowercase letter", () => {
    const result = validatePasswordComplexity("VALIDPASS123!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one lowercase letter"
    );
  });

  it("should reject password without number", () => {
    const result = validatePasswordComplexity("ValidPass!");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one number"
    );
  });

  it("should reject password without special character", () => {
    const result = validatePasswordComplexity("ValidPass123");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one special character"
    );
  });

  it("should return all applicable errors for completely invalid password", () => {
    const result = validatePasswordComplexity("pass");
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain(
      "Password must be at least 8 characters long"
    );
    expect(result.errors).toContain(
      "Password must contain at least one uppercase letter"
    );
    expect(result.errors).toContain(
      "Password must contain at least one number"
    );
    expect(result.errors).toContain(
      "Password must contain at least one special character"
    );
  });

  it("should accept various special characters", () => {
    const specialChars = [
      "!",
      "@",
      "#",
      "$",
      "%",
      "^",
      "&",
      "*",
      "(",
      ")",
      "_",
      "+",
      "-",
      "=",
      "[",
      "]",
      "{",
      "}",
      ";",
      "'",
      ":",
      '"',
      "\\",
      "|",
      ",",
      ".",
      "<",
      ">",
      "/",
      "?",
    ];

    for (const char of specialChars) {
      const password = `ValidPass123${char}`;
      const result = validatePasswordComplexity(password);
      expect(result.isValid).toBe(true);
    }
  });
});
