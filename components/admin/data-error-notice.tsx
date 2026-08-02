export function DataErrorNotice({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Could not load data.</p>
      <p className="mt-1">{message}</p>
      <p className="mt-1 text-amber-700">
        If this mentions a missing environment variable, see{" "}
        <code>.env.example</code> and <code>STATUS.md</code> — Firebase
        secrets haven&apos;t been configured yet.
      </p>
    </div>
  );
}
