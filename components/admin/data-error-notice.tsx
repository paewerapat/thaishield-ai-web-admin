import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DataErrorNotice({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="size-[18px] text-amber-700" aria-hidden />
          Could not load data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-mono text-xs leading-relaxed text-foreground">
          {message}
        </p>
        <p className="text-muted-foreground">
          If this mentions credentials, run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            gcloud auth application-default login
          </code>{" "}
          and restart the dev server. See <code>STATUS.md</code> for the current
          setup state.
        </p>
      </CardContent>
    </Card>
  );
}
