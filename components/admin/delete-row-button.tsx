"use client";

import { Trash2 } from "lucide-react";
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
 */
export function DeleteRowButton({
  id,
  label,
  action,
}: {
  id: string;
  /** Human-readable name of the row, shown in the confirmation prompt. */
  label: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <AlertDialog>
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <AlertDialogAction
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
