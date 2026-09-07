import type { Metadata } from "next";

/**
 * Public subscription terms — Thai and English on one page.
 *
 * ## Why this exists
 *
 * Apple rejects a build whose subscription purchase screen does not link to
 * functional Terms of Use and Privacy Policy URLs, and Play expects the same.
 * The app links here from the paywall (`_LegalLinks` in `paywall_screen.dart`).
 * Before 2026-08-30 the plans were one-time purchases and no terms link was
 * required, which is why this page is newer than the privacy policy.
 *
 * ## 🚨 Must stay outside `/admin`
 *
 * Auth is enforced in `app/admin/layout.tsx`, not in middleware, so anything
 * outside `/admin` is public. A store reviewer has to read this without an
 * account. Do not move it, and do not add global auth middleware without
 * exempting `/terms` and `/privacy` — either would turn the paywall's links
 * into redirects and fail review.
 *
 * ## What this is and is not
 *
 * It states the billing terms the stores require to be visible: what renews,
 * what is charged, where to cancel, and what happens when you do. It is
 * deliberately narrow. It is **not** a full terms-of-service agreement, and it
 * does not attempt to limit liability or grant licences — the operator should
 * have a lawyer write those if they want them. Every sentence here describes
 * behaviour the app and the stores actually implement, which is the part a
 * reviewer checks.
 *
 * The operator named here is the client, not the developer. They should read
 * this before it is published.
 */
export const metadata: Metadata = {
  title: "เงื่อนไขการใช้งาน / Terms of Use — ThaiShield AI",
  description:
    "เงื่อนไขการสมัครสมาชิก ThaiShield AI — การต่ออายุอัตโนมัติ การเรียกเก็บเงิน และการยกเลิก",
};

const LAST_UPDATED = "7 กันยายน 2026 / 7 September 2026";
const CONTACT_EMAIL = "support@thaishieldapp.com";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 text-[15px] leading-relaxed text-slate-800">
      <header className="mb-10 border-b pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-700">
          ThaiShield AI
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          เงื่อนไขการใช้งาน · Terms of Use
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          ปรับปรุงล่าสุด / Last updated: {LAST_UPDATED}
        </p>
      </header>

      <ThaiTerms />

      <hr className="my-12 border-slate-200" />

      <EnglishTerms />

      <footer className="mt-12 border-t pt-6 text-sm text-slate-500">
        <p>
          ติดต่อ / Contact:{" "}
          <a
            className="text-emerald-700 underline"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </footer>
    </main>
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

function ThaiTerms() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">ภาษาไทย</h2>

      <Section heading="1. แพ็กเกจ Premium">
        <p>
          ThaiShield AI Premium มีสองแบบ และ{" "}
          <strong>เก็บเงินคนละวิธี</strong> ได้แก่{" "}
          <strong>สมาชิกรายเดือนแบบต่ออายุอัตโนมัติ</strong> และ{" "}
          <strong>บัตรผ่าน 14 วันแบบจ่ายครั้งเดียว</strong>{" "}
          ราคาที่คุณต้องชำระจริงคือราคาที่แสดงใน Google Play หรือ App Store
          ของประเทศคุณ ซึ่งอาจต่างจากที่แสดงในแอปตามสกุลเงินและภาษี
        </p>
      </Section>

      <Section heading="2. การเรียกเก็บเงินและการต่ออายุ">
        <p>
          <strong>แผนรายเดือน</strong> ระบบจะเรียกเก็บเงินผ่านบัญชี Google Play
          หรือ Apple ID ที่คุณใช้สมัคร เมื่อครบกำหนดแต่ละรอบ
          ระบบจะเรียกเก็บเงินรอบถัดไปโดยอัตโนมัติจนกว่าคุณจะยกเลิก
        </p>
        <p>
          <strong>บัตรผ่าน 14 วัน</strong> เรียกเก็บเงินเพียงครั้งเดียว{" "}
          <strong>ไม่มีการต่ออายุและไม่มีการเรียกเก็บเงินซ้ำ</strong>{" "}
          โดยนับ 14 วันต่อเนื่องจากเวลาที่ซื้อ
          ไม่หยุดนับระหว่างที่คุณไม่ได้ใช้แอป หากต้องการใช้ต่อ
          คุณต้องซื้อบัตรผ่านใหม่ด้วยตัวเอง
        </p>
        <p>
          การชำระเงินทั้งหมดดำเนินการโดยร้านค้า{" "}
          <strong>เราไม่เห็นและไม่เก็บข้อมูลบัตรหรือข้อมูลการชำระเงินของคุณ</strong>
        </p>
      </Section>

      <Section heading="3. การยกเลิก">
        <p>
          แผนรายเดือนยกเลิกได้ตลอดเวลาที่{" "}
          <strong>หน้าตั้งค่าการสมัครสมาชิกของ Google Play หรือ App Store</strong>{" "}
          — ไม่ได้ยกเลิกในแอปนี้ เพราะร้านค้าเป็นผู้ดูแลการเรียกเก็บเงินทั้งหมด
        </p>
        <p>
          เมื่อยกเลิกแล้ว คุณยังใช้ฟีเจอร์ Premium
          ได้ต่อจนครบรอบที่ชำระเงินไปแล้ว
        </p>
        <p>
          <strong>บัตรผ่าน 14 วันไม่มีอะไรให้ยกเลิก</strong>{" "}
          เพราะจ่ายครั้งเดียวและไม่ต่ออายุ — สิทธิ์จะสิ้นสุดเองเมื่อครบ 14 วัน
        </p>
        <p>
          เมื่อสิทธิ์สิ้นสุด แอปจะกลับไปใช้เวอร์ชันฟรี โดยข้อมูลของคุณไม่ถูกลบ
        </p>
      </Section>

      <Section heading="4. ทดลองใช้ฟรี">
        <p>
          ผู้ใช้ใหม่ได้ทดลองใช้ฟรี 3 วันโดยไม่มีการเรียกเก็บเงิน
          เมื่อครบกำหนดแอปจะกลับไปใช้เวอร์ชันฟรีเอง{" "}
          <strong>
            การทดลองใช้ไม่ได้เปลี่ยนเป็นสมาชิกโดยอัตโนมัติ
          </strong>{" "}
          — การเรียกเก็บเงินจะเริ่มก็ต่อเมื่อคุณเลือกแพ็กเกจและยืนยันการชำระเงินด้วยตัวเอง
        </p>
      </Section>

      <Section heading="5. การกู้คืนและการใช้ข้ามอุปกรณ์">
        <p>
          การซื้อผูกกับบัญชี Google Play หรือ Apple ID ที่ใช้ซื้อ{" "}
          <strong>แผนรายเดือน</strong> หากติดตั้งใหม่หรือเปลี่ยนเครื่องภายในระบบเดิม
          กดกู้คืนการซื้อในแอปเพื่อใช้ต่อได้ทั้งบน Android และ iOS
        </p>
        <p>
          <strong>บัตรผ่าน 14 วันกู้คืนได้บน Android เท่านั้น</strong>{" "}
          บน iOS ระบบของ Apple ไม่ส่งการซื้อแบบใช้แล้วหมดไปกลับมาอีก
          ดังนั้นหากลบแอปก่อนครบ 14 วัน วันที่เหลือจะหายไป
        </p>
        <p>
          <strong>สิทธิ์ไม่โอนข้ามระหว่าง Android และ iOS</strong>{" "}
          เนื่องจากเป็นคนละบัญชีร้านค้า
        </p>
      </Section>

      <Section heading="6. การคืนเงิน">
        <p>
          การคืนเงินเป็นไปตามนโยบายของ Google Play หรือ App Store
          และต้องดำเนินการผ่านร้านค้าโดยตรง เราไม่สามารถคืนเงินให้ได้เอง
        </p>
      </Section>

      <Section heading="7. ขอบเขตของข้อมูลในแอป">
        <p>
          ข้อมูลราคา พื้นที่ และเส้นทางที่แอปแสดง{" "}
          <strong>เป็นข้อมูลประกอบการตัดสินใจเท่านั้น</strong>{" "}
          รวบรวมจากข้อมูลสถิติ ข้อมูลจากชุมชน และผู้ให้บริการแผนที่
          ราคาและสภาพจริงอาจแตกต่างกันได้ โปรดใช้วิจารณญาณ
          และปฏิบัติตามกฎจราจรและป้ายบอกทางเสมอ
        </p>
      </Section>
    </div>
  );
}

function EnglishTerms() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">English</h2>

      <Section heading="1. Premium plans">
        <p>
          ThaiShield AI Premium comes in two plans that are{" "}
          <strong>charged differently</strong>: an{" "}
          <strong>auto-renewing monthly subscription</strong> and a{" "}
          <strong>one-time 14-day pass</strong>. The price you pay is the one
          shown in Google Play or the App Store for your country, which may
          differ from the figure shown in the app because of currency and tax.
        </p>
      </Section>

      <Section heading="2. Billing and renewal">
        <p>
          <strong>The monthly plan.</strong> Payment is charged to the Google
          Play or Apple ID account you subscribe with. At the end of each period
          the next one is charged automatically, until you cancel.
        </p>
        <p>
          <strong>The 14-day pass.</strong> It is charged once and{" "}
          <strong>never renews or charges you again</strong>. Its 14 days run
          continuously from the time of purchase and do not pause while you are
          not using the app. To carry on afterwards you buy another pass
          yourself.
        </p>
        <p>
          All payments are handled by the store.{" "}
          <strong>
            We never see or store your card or payment details.
          </strong>
        </p>
      </Section>

      <Section heading="3. Cancellation">
        <p>
          The monthly plan can be cancelled at any time in the{" "}
          <strong>
            subscription settings of Google Play or the App Store
          </strong>{" "}
          — not in this app, because the store handles all billing. After
          cancelling you keep Premium until the end of the period you have
          already paid for.
        </p>
        <p>
          <strong>The 14-day pass has nothing to cancel</strong>: it is bought
          once and does not renew, so it simply ends after its 14 days.
        </p>
        <p>
          When access ends the app returns to the free version and none of your
          data is deleted.
        </p>
      </Section>

      <Section heading="4. Free trial">
        <p>
          New users get 3 days free and nothing is charged for them. When the
          trial ends the app returns to the free version on its own.{" "}
          <strong>The trial does not convert into a subscription</strong> —
          billing starts only if you choose a plan and confirm the payment
          yourself.
        </p>
      </Section>

      <Section heading="5. Restoring and using on another device">
        <p>
          A purchase is tied to the Google Play or Apple ID account you buy
          with. <strong>The monthly plan</strong> can be restored in the app
          after reinstalling or moving to a new phone, on both Android and iOS.
        </p>
        <p>
          <strong>The 14-day pass can be restored on Android only.</strong>{" "}
          Apple does not replay a used-up purchase, so on iOS deleting the app
          before the 14 days are up loses the remaining days.
        </p>
        <p>
          <strong>
            Access does not transfer between Android and iOS
          </strong>
          , because those are separate store accounts.
        </p>
      </Section>

      <Section heading="6. Refunds">
        <p>
          Refunds follow the policy of Google Play or the App Store and must be
          requested through the store. We cannot issue refunds ourselves.
        </p>
      </Section>

      <Section heading="7. What the information in the app is">
        <p>
          The prices, areas and routes the app shows are{" "}
          <strong>for information only</strong>, drawn from statistical data,
          community data and mapping providers. Actual prices and conditions may
          differ. Use your own judgement, and always follow traffic laws and
          road signs.
        </p>
      </Section>
    </div>
  );
}
