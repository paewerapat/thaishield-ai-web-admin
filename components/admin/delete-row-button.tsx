"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Delete used to be a bare submit button, so a mis-click destroyed a Firestore
 * document with no confirmation and no undo. `action` is a Server Action passed
 * down from the (server) list page — Next.js serialises it as a reference, so
 * this stays a Client Component without pulling the action's code into the
 * bundle.
 *
 * It is invoked programmatically rather than through `<form action={...}>`
 * because a form action's return value is discarded. A failing delete then
 * looked exactly like a successful one: dialog closes, row stays put, and the
 * only hint is a row that reappears on the next refresh. Calling it directly
 * gives us the ActionResult to report.
 */
export function DeleteRowButton({
  id,
  label,
  action,
}: {
  id: string;
  /** Human-readable name of the row, shown in the confirmation prompt. */
  label: string;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        // Dialog stays open on failure — closing it would strand the user on a
        // list that still shows the row with no explanation of why.
        toast.error(`Could not delete “${label}”`, {
          description: result.error,
        });
        return;
      }
      setOpen(false);
      toast.success(`Deleted “${label}”`, {
        description: "The ThaiShield app stops showing it on its next read.",
      });
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the record from Firestore immediately. The ThaiShield
            app stops showing it as soon as it next reads the collection. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            // Radix closes the dialog on its own click handler; we control
            // `open` ourselves so it can stay put when the delete fails.
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
