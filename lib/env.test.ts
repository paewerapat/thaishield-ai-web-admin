import { afterEach, describe, expect, it } from "vitest";
import { optionalEnv, requireEnv } from "./env";

describe("requireEnv", () => {
  const KEY = "TEST_ONLY_VAR";

  afterEach(() => {
    delete process.env[KEY];
  });

  it("returns the value when set", () => {
    process.env[KEY] = "value";
    expect(requireEnv(KEY)).toBe("value");
  });

  it("throws a descriptive error naming the missing key", () => {
    delete process.env[KEY];
    expect(() => requireEnv(KEY)).toThrow(/TEST_ONLY_VAR/);
  });

  it("throws when set to an empty string", () => {
    process.env[KEY] = "";
    expect(() => requireEnv(KEY)).toThrow();
  });
});

describe("optionalEnv", () => {
  it("returns undefined when unset", () => {
    expect(optionalEnv("TEST_ONLY_VAR_UNSET")).toBeUndefined();
  });

  it("returns the value when set", () => {
    process.env.TEST_ONLY_VAR_UNSET = "abc";
    expect(optionalEnv("TEST_ONLY_VAR_UNSET")).toBe("abc");
    delete process.env.TEST_ONLY_VAR_UNSET;
  });
});
