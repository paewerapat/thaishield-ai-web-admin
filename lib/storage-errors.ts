/**
 * Lives outside lib/actions/ because that directory is `"use server"`, where
 * every export must be an async Server Action — a plain predicate could not be
 * exported from there, and so could not be unit tested.
 */

/**
 * True when a Cloud Storage failure means the target bucket itself is absent,
 * rather than the upload having gone wrong.
 *
 * @google-cloud/storage surfaces this as an ApiError with `code: 404`, but the
 * message is also matched because the error crosses a few layers (Admin SDK,
 * teeny-request) that have historically reshaped it, and a 404 alone is not
 * specific enough to key a bucket-specific message on.
 */
export function isBucketMissingError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { code, message } = error as { code?: unknown; message?: unknown };
  const mentionsMissingBucket =
    typeof message === "string" &&
    /bucket.*does not exist|no such bucket/i.test(message);

  return code === 404 || mentionsMissingBucket;
}

/**
 * Explains the two things that actually cause a missing bucket, because the
 * raw GCS error names neither: Storage was never provisioned for the project,
 * or the configured name uses the wrong convention for the project's age.
 */
export function bucketMissingMessage(bucketName: string): string {
  return (
    `Firebase Storage bucket "${bucketName}" does not exist. Enable Storage in ` +
    "the Firebase Console (Build → Storage → Get started), then make sure " +
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET matches the bucket it creates — " +
    "projects created before October 2024 use <project-id>.appspot.com, newer " +
    "ones use <project-id>.firebasestorage.app."
  );
}
