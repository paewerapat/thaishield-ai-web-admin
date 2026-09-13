import type { Metadata } from "next";

/**
 * Public support page — Thai and English on one page.
 *
 * ## Why this exists
 *
 * App Store Connect requires a Support URL that leads to real contact
 * information, and Apple rejects one that goes to a placeholder. The domain
 * thaishieldapp.com is still a "Coming Soon" parking page, so until 2026-09-14
 * the listing pointed at `/privacy`, which only contains the address in passing.
 * This page is the listing's Support URL in all six localizations.
 *
 * ## 🚨 Must stay outside `/admin`
 *
 * Same rule as `/terms` and `/privacy`: auth lives in `app/admin/layout.tsx`, so
 * anything outside `/admin` is public, and a store reviewer must open this
 * without an account.
 *
 * ## What it may say
 *
 * Every answer describes what the app and the stores actually do — the same
 * facts `/terms` states. If a plan, the trial, or restore behaviour changes,
 * this page changes in the same commit (`lib/legal-pages-billing.test.ts`
 * reads it alongside the other two).
 */
export const metadata: Metadata = {
  title: "ช่วยเหลือ / Support — ThaiShield AI",
  description:
    "ติดต่อทีม ThaiShield AI และคำตอบเรื่องการสมัครสมาชิก การกู้คืนการซื้อ และข้อมูลส่วนตัว",
};

const LAST_UPDATED = "14 กันยายน 2026 / 14 September 2026";
const CONTACT_EMAIL = "support@thaishieldapp.com";

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-[15px] leading-relaxed text-slate-800">
      <header className="mb-10 border-b pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-700">
          ThaiShield AI
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          ช่วยเหลือ · Support
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          ปรับปรุงล่าสุด / Last updated: {LAST_UPDATED}
        </p>
      </header>

      <ContactCard />

      <ThaiSupport />

      <hr className="my-12 border-slate-200" />

      <EnglishSupport />

      <footer className="mt-12 border-t pt-6 text-sm text-slate-500">
        <p>
          <a className="text-emerald-700 underline" href="/terms">
            เงื่อนไขการใช้งาน / Terms of Use
          </a>
          {" · "}
          <a className="text-emerald-700 underline" href="/privacy">
            นโยบายความเป็นส่วนตัว / Privacy Policy
          </a>
        </p>
      </footer>
    </main>
  );
}

function ContactCard() {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <p className="font-semibold text-slate-900">ติดต่อเรา · Contact us</p>
      <p className="mt-2">
        อีเมล / Email:{" "}
        <a
          className="font-medium text-emerald-700 underline"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className="mt-3 text-sm text-slate-600">
        <strong>เหตุฉุกเฉินไม่ต้องรออีเมล</strong> — โทร 191 (ตำรวจ) หรือ 1155
        (ตำรวจท่องเที่ยว) ·{" "}
        <strong>In an emergency do not wait for email</strong> — call 191
        (Police) or 1155 (Tourist Police).
      </p>
    </section>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-base font-semibold text-slate-900">{heading}</h2>
      <div className="space-y-3 text-slate-700">{children}</div>
    </section>
  );
}

function ThaiSupport() {
  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">ภาษาไทย</h2>

      <Section heading="เวลาติดต่อเรา ช่วยแนบข้อมูลนี้มาด้วย">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>รหัสติดตั้งและเวอร์ชันแอป</strong> — ดูได้ที่แท็บโปรไฟล์
            ส่วน &quot;เกี่ยวกับ ThaiShield AI&quot; แอปไม่มีระบบบัญชีผู้ใช้
            รหัสนี้จึงเป็นวิธีเดียวที่เราหารายการของคุณเจอ
          </li>
          <li>รุ่นโทรศัพท์ และระบบ Android หรือ iOS</li>
          <li>
            ถ้าเป็นเรื่องการซื้อ — <strong>รหัสรายการซื้อ</strong>{" "}
            จากอีเมลใบเสร็จของ Google Play หรือ Apple
          </li>
        </ul>
      </Section>

      <Section heading="แพ็กเกจ Premium มีแบบไหนบ้าง">
        <p>
          มีสองแบบ คือ <strong>สมาชิกรายเดือนแบบต่ออายุอัตโนมัติ</strong> และ{" "}
          <strong>บัตรผ่าน 14 วัน</strong> ที่จ่ายครั้งเดียว ไม่ต่ออายุ
          เปิดดูได้จากปุ่ม &quot;ดูแพ็กเกจ&quot; ในหน้าแรกหรือหน้าโปรไฟล์
          รายละเอียดการเรียกเก็บเงินอยู่ใน{" "}
          <a className="text-emerald-700 underline" href="/terms">
            เงื่อนไขการใช้งาน
          </a>
        </p>
      </Section>

      <Section heading="ยกเลิกสมาชิกรายเดือนอย่างไร">
        <p>
          ยกเลิกที่หน้าตั้งค่าการสมัครสมาชิกของร้านค้า ไม่ใช่ในแอป
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Android:</strong> แอป Google Play → รูปโปรไฟล์ → การชำระเงินและการสมัครใช้บริการ →
            การสมัครใช้บริการ → ThaiShield AI → ยกเลิก
          </li>
          <li>
            <strong>iPhone:</strong> การตั้งค่า → ชื่อของคุณ → การสมัครรับ →
            ThaiShield AI → ยกเลิกการสมัครรับ
          </li>
        </ul>
        <p>
          หลังยกเลิกยังใช้ Premium ได้จนครบรอบที่จ่ายไปแล้ว ·
          บัตรผ่าน 14 วันไม่มีอะไรให้ยกเลิก เพราะไม่ต่ออายุ
        </p>
      </Section>

      <Section heading="ซื้อแล้ว แต่ยังใช้ Premium ไม่ได้">
        <ol className="list-decimal space-y-1 pl-5">
          <li>ตรวจว่าเชื่อมต่ออินเทอร์เน็ตอยู่ แล้วปิดและเปิดแอปใหม่</li>
          <li>
            กด &quot;ดูแพ็กเกจ&quot; แล้วกด <strong>&quot;กู้คืนการซื้อ&quot;</strong>
          </li>
          <li>
            ตรวจว่าโทรศัพท์ใช้บัญชี Google Play หรือ Apple ID เดียวกับที่ใช้ซื้อ
          </li>
          <li>ถ้ายังไม่ได้ ส่งอีเมลหาเราพร้อมข้อมูลในหัวข้อแรก</li>
        </ol>
      </Section>

      <Section heading="เปลี่ยนเครื่องหรือติดตั้งแอปใหม่">
        <p>
          สมาชิกรายเดือนกู้คืนได้ทั้ง Android และ iOS ด้วยบัญชีร้านค้าเดิม ·{" "}
          <strong>บัตรผ่าน 14 วันกู้คืนได้บน Android เท่านั้น</strong>{" "}
          บน iPhone ถ้าลบแอปก่อนครบ 14 วัน วันที่เหลือจะหายไป ·
          สิทธิ์ไม่โอนข้ามระหว่าง Android และ iOS
        </p>
      </Section>

      <Section heading="ขอคืนเงิน">
        <p>
          การคืนเงินดำเนินการโดยร้านค้าตามนโยบายของ Google Play หรือ Apple
          เราคืนเงินให้เองไม่ได้ ·{" "}
          <strong>Android:</strong> ขอได้ที่หน้าประวัติการสั่งซื้อของ Google Play ·{" "}
          <strong>iPhone:</strong> ขอได้ที่ reportaproblem.apple.com
        </p>
      </Section>

      <Section heading="ข้อมูลส่วนตัวและการขอลบข้อมูล">
        <p>
          แอปไม่มีระบบสมัครสมาชิก และไม่เก็บชื่อ อีเมล หรือเบอร์โทรศัพท์ ·
          หากต้องการให้ลบข้อมูลการใช้งานหรือประวัติการซื้อที่ผูกกับเครื่องของคุณ
          ส่งอีเมลพร้อมรหัสติดตั้ง รายละเอียดทั้งหมดอยู่ใน{" "}
          <a className="text-emerald-700 underline" href="/privacy">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>
      </Section>

      <Section heading="ข้อมูลในแอปไม่ถูกต้อง">
        <p>
          ราคาอ้างอิง สถานที่ และพื้นที่ในแอปเป็นข้อมูลประกอบการตัดสินใจ
          หากพบข้อมูลที่ไม่ตรงกับความเป็นจริง แจ้งเราทางอีเมลได้
          โปรดระบุชื่อสถานที่หรือรายการ และสิ่งที่ควรแก้ไข
        </p>
      </Section>
    </div>
  );
}

function EnglishSupport() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">English</h2>

      <Section heading="When you contact us, please include">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Your install ID and app version</strong> — in the Profile
            tab under &quot;About ThaiShield AI&quot;. The app has no accounts,
            so this ID is the only way we can find your records.
          </li>
          <li>Your phone model, and whether it is Android or iOS</li>
          <li>
            For a purchase question — the <strong>order ID</strong> from your
            Google Play or Apple receipt email
          </li>
        </ul>
      </Section>

      <Section heading="What are the Premium plans?">
        <p>
          There are two: an <strong>auto-renewing monthly subscription</strong>{" "}
          and a <strong>14-day pass</strong> that is bought once and does not
          renew. Open them from &quot;View plans&quot; on the Home or Profile
          screen. Billing details are in the{" "}
          <a className="text-emerald-700 underline" href="/terms">
            Terms of Use
          </a>
          .
        </p>
      </Section>

      <Section heading="How do I cancel the monthly subscription?">
        <p>In your store&apos;s subscription settings, not in the app.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Android:</strong> Google Play app → profile picture →
            Payments &amp; subscriptions → Subscriptions → ThaiShield AI →
            Cancel
          </li>
          <li>
            <strong>iPhone:</strong> Settings → your name → Subscriptions →
            ThaiShield AI → Cancel Subscription
          </li>
        </ul>
        <p>
          After cancelling you keep Premium until the end of the period already
          paid for. The 14-day pass has nothing to cancel, because it does not
          renew.
        </p>
      </Section>

      <Section heading="I paid but Premium is not unlocked">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Check you are online, then close and reopen the app.</li>
          <li>
            Tap &quot;View plans&quot;, then <strong>&quot;Restore Purchases&quot;</strong>.
          </li>
          <li>
            Make sure the phone uses the same Google Play account or Apple ID
            you bought with.
          </li>
          <li>If it still does not work, email us with the details above.</li>
        </ol>
      </Section>

      <Section heading="New phone or reinstalling the app">
        <p>
          The monthly subscription restores on both Android and iOS with the
          same store account.{" "}
          <strong>The 14-day pass restores on Android only</strong> — on iPhone,
          deleting the app before the 14 days are up loses the remaining days.
          Access does not transfer between Android and iOS.
        </p>
      </Section>

      <Section heading="Refunds">
        <p>
          Refunds are handled by the store under Google Play&apos;s or
          Apple&apos;s policy; we cannot issue them ourselves.{" "}
          <strong>Android:</strong> request one from your Google Play order
          history. <strong>iPhone:</strong> request one at
          reportaproblem.apple.com.
        </p>
      </Section>

      <Section heading="Your data and deletion requests">
        <p>
          The app has no sign-up and does not collect your name, email address
          or phone number. To have the usage or purchase records linked to your
          install deleted, email us with your install ID. Full details are in
          the{" "}
          <a className="text-emerald-700 underline" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
      </Section>

      <Section heading="Information in the app looks wrong">
        <p>
          Reference prices, places and areas in the app are information to help
          you decide. If something does not match what you find, email us with
          the place or item name and what should change.
        </p>
      </Section>
    </div>
  );
}
