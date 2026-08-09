import { describe, expect, it } from "vitest";
import { bucketMissingMessage, isBucketMissingError } from "./storage-errors";

describe("isBucketMissingError", () => {
  it("recognises the ApiError shape @google-cloud/storage throws", () => {
    const apiError = Object.assign(
      new Error("The specified bucket does not exist."),
      { code: 404 },
    );
    expect(isBucketMissingError(apiError)).toBe(true);
  });

  it("recognises the message alone when the code has been stripped", () => {
    expect(
      isBucketMissingError(new Error("The specified bucket does not exist.")),
    ).toBe(true);
  });

  it("recognises the alternative 'No such bucket' phrasing", () => {
    expect(isBucketMissingError(new Error("No such bucket: foo"))).toBe(true);
  });

  it("recognises a bare 404 with no useful message", () => {
    expect(isBucketMissingError({ code: 404 })).toBe(true);
  });

  describe("does not misfire on", () => {
    it("a permission error", () => {
      const forbidden = Object.assign(new Error("Permission denied"), {
        code: 403,
      });
      expect(isBucketMissingError(forbidden)).toBe(false);
    });

    it("a missing object rather than a missing bucket", () => {
      // Deliberately code-less: a 404 for an absent *object* would otherwise be
      // reported to staff as "the bucket does not exist", sending them off to
      // re-provision Storage that is working fine.
      expect(isBucketMissingError(new Error("No such object: x.jpg"))).toBe(
        false,
      );
    });

    it("null and undefined", () => {
      expect(isBucketMissingError(null)).toBe(false);
      expect(isBucketMissingError(undefined)).toBe(false);
    });

    it("a plain string", () => {
      expect(isBucketMissingError("bucket does not exist")).toBe(false);
    });
  });
});

describe("bucketMissingMessage", () => {
  it("names the bucket and both naming conventions", () => {
    const message = bucketMissingMessage("demo-project.firebasestorage.app");

    expect(message).toContain("demo-project.firebasestorage.app");
    expect(message).toContain("appspot.com");
    expect(message).toContain("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  });
});
