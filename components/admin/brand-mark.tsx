import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The ThaiShield app icon.
 *
 * Two things to know about the source file:
 *  - It is a 1.5MB JPEG, so it goes through next/image rather than a plain
 *    <img>. Next resizes and re-encodes it to the requested size, which is what
 *    keeps a 36px sidebar logo from shipping a megabyte and a half.
 *  - JPEG has no alpha, and the artwork is a rounded square sitting on black.
 *    Rendering it flat therefore puts a black box on the green chrome. The
 *    rounded clip below trims those corners; keep it if the size changes.
 */
export function BrandMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/images/logo.jpg"
      alt=""
      width={size}
      height={size}
      priority
      className={cn("shrink-0 rounded-[22%]", className)}
    />
  );
}
