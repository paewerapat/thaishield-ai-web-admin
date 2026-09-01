import { Info } from "lucide-react";

/**
 * The paragraph that stops both reporting pages from being misread.
 *
 * 🚨 **This is not decoration and should not be tidied away.** Two things on
 * those pages look like ordinary columns and are not:
 *
 *  1. **There is no email**, and the client specifically asked for one. Without
 *     a sentence saying why, a missing column reads as an unfinished feature —
 *     and the likeliest next step is somebody asking for it again, or worse,
 *     somebody filling it with a device identifier to make the page look
 *     complete.
 *  2. **A row is an install, not a person.** Every count on these pages is a
 *     count of app installs. Reinstalling, clearing app data or changing phone
 *     makes a new row; one shared handset makes a single row for two people.
 *     A "users" figure quoted from here into a report or an investor
 *     conversation would be wrong in a direction nobody would catch.
 *
 * Written in Thai and English because the client reads Thai and the app's
 * documentation is in English. The two say the same thing; if one is edited,
 * edit both.
 */
export function ReportingNotice() {
  return (
    <div className="mb-6 flex gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
      <Info
        className="mt-0.5 size-[18px] shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="space-y-2 leading-relaxed">
        <p className="text-foreground">
          <strong>หนึ่งแถว = หนึ่งการติดตั้งแอป ไม่ใช่หนึ่งคน.</strong>{" "}
          แอปไม่มีระบบล็อกอิน จึงไม่มีอีเมลหรือชื่อผู้ใช้ให้แสดง — และร้านค้า
          Google Play กับ App Store ก็ไม่ส่งอีเมลผู้ซื้อกลับมาเช่นกัน
          ระบบจึงใช้รหัสสุ่มประจำเครื่อง (Install ID) แทน
          ถ้าผู้ใช้ลบแอปแล้วติดตั้งใหม่ หรือเปลี่ยนเครื่อง จะนับเป็นแถวใหม่
        </p>
        <p className="text-muted-foreground">
          One row is one app install, not one person. The app has no sign-in, so
          there is no email or name to show — and neither store returns the
          buyer&apos;s email either. A random per-install id is used instead.
          Reinstalling or changing device creates a new row, so treat every
          total here as a count of installs.
        </p>
      </div>
    </div>
  );
}
