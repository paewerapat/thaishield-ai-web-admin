import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Skeleton, hand-written rather than pulled through the CLI — see
 * .claude/skills/admin-ui/SKILL.md on why the generator is not let near this
 * project.
 *
 * `bg-muted` is the same grey the table header sits on, so a placeholder row
 * reads as "not filled in yet" rather than as content with no text.
 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
