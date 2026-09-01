import type { Metadata } from "next";
import Image from "next/image";

/**
 * Public privacy policy — Thai and English on one page.
 *
 * ## Why it lives in the admin app
 *
 * Google Play and App Store Connect both require a **publicly reachable**
 * privacy policy URL before an app can be uploaded at all, including to an
 * internal test track. This project already deploys the admin to Firebase App
 * Hosting, so a route here is a stable public URL at no extra cost and with
 * nothing new to maintain.
 *
 * ## 🚨 This route must stay outside `/admin`
 *
 * Authentication is enforced in `app/admin/layout.tsx`, not in middleware, so
 * anything under `/admin` is signed-in-only and anything outside it is public.
 * That is exactly what this page needs — a store reviewer, and any user, has
 * to be able to read it without an account. **Do not move this file under
 * `/admin`, and do not add a global auth middleware without exempting
 * `/privacy`**: either would make the URL return a redirect and break the app's
 * store listing rather than just this page.
 *
 * ## What the content is based on
 *
 * Every claim below was written against what the Flutter app actually does as
 * of 2026-09-01 — the permissions it requests, the services it calls, and the
 * collections it writes. If a feature changes what leaves the device, this
 * page has to change with it. In particular:
 *
 *   - location is foreground-only (§7 forbids background/geofencing);
 *   - there is no account system, so there is no profile to hold;
 *   - `entitlements` stores a store transaction id and an expiry, nothing else;
 *   - `app_users` and `purchase_transactions` (added 2026-09-01, for the CMS's
 *     reporting pages) store a **random per-install id** plus first/last-seen
 *     dates, platform, app version, chosen language, and the outcome of each
 *     purchase attempt.
 *
 * 🚨 **That last collection pair is why §3, §4, §5 and §7 changed on
 * 2026-09-01, and it is the shape of change to watch for.** A reporting feature
 * built for the admin is still data collection, and shipping one without
 * amending this page would have made a published legal document false. The
 * random id was chosen over a device identifier precisely so this amendment
 * stays a disclosure rather than a new lawful-basis argument — the id is not
 * derived from the handset and does not survive a reinstall. **Both stores'
 * Data Safety declarations need the same amendment**, and that is on the
 * client, not in this repo.
 *
 * The operator named here is the data controller under the PDPA and is the
 * client, not the developer. They should read this before it is published, and
 * may want to add their registered address — Google already publishes it on the
 * Play listing for a personal developer account, so it is not new information.
 */
export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Privacy Policy — ThaiShield AI",
  description:
    "How the ThaiShield AI mobile app handles location, camera, microphone and purchase data.",
};

const LAST_UPDATED = "1 กันยายน 2026 / 1 September 2026";
const CONTACT_EMAIL = "support@thaishieldapp.com";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-brand">
        <Image
          src="/images/skyline.png"
          alt=""
          aria-hidden
          width={904}
          height={264}
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none opacity-[0.07]"
        />
        <div className="relative mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm font-semibold tracking-wide text-gold">
            ThaiShield AI
          </p>
          <h1 className="mt-2 text-2xl font-bold text-brand-foreground sm:text-3xl">
            นโยบายความเป็นส่วนตัว
            <span className="block text-lg font-semibold text-brand-foreground/70 sm:text-xl">
              Privacy Policy
            </span>
          </h1>
          <p className="mt-3 text-sm text-brand-foreground/60">
            ปรับปรุงล่าสุด / Last updated: {LAST_UPDATED}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <nav aria-label="ภาษา / Language" className="mb-8 flex gap-3 text-sm">
          <a className="font-semibold text-primary underline" href="#th">
            ภาษาไทย
          </a>
          <span aria-hidden className="text-muted-decorative">
            ·
          </span>
          <a className="font-semibold text-primary underline" href="#en">
            English
          </a>
        </nav>

        <ThaiPolicy />

        <hr className="my-12 border-border" />

        <EnglishPolicy />

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          ThaiShield AI · {CONTACT_EMAIL}
        </footer>
      </div>
    </main>
  );
}

function Section({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-6 first:mt-0">
      <h3 className="text-base font-bold text-foreground">{heading}</h3>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function ThaiPolicy() {
  return (
    <article id="th" className="scroll-mt-6">
      <h2 className="text-xl font-bold text-foreground">ภาษาไทย</h2>

      <Section heading="1. ผู้ให้บริการ">
        <p>
          แอปพลิเคชัน ThaiShield AI (&quot;แอป&quot;) ให้บริการโดย ThaiShield AI
          (&quot;เรา&quot;) ซึ่งเป็นผู้ควบคุมข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
          พ.ศ. 2562 (PDPA) หากมีข้อสงสัยเกี่ยวกับนโยบายนี้ ติดต่อได้ที่{" "}
          <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <Section heading="2. แอปนี้ไม่มีบัญชีผู้ใช้">
        <p>
          แอปไม่มีการสร้างบัญชี ไม่มีการเข้าสู่ระบบ และไม่มีการลงทะเบียนผู้ใช้
          เราจึงไม่มีชื่อ อีเมล เบอร์โทรศัพท์ หรือโปรไฟล์ของผู้ใช้อยู่ในระบบเลย
          และไม่สามารถระบุตัวตนของผู้ใช้รายใดรายหนึ่งได้
        </p>
        <p className="text-slate-600">
          หัวข้อนี้พูดถึง <strong>บัญชีผู้ใช้</strong> ไม่ใช่แพ็กเกจ Premium —
          Premium ยังมีอยู่และเป็นแบบต่ออายุอัตโนมัติ ดูหัวข้อ 4
          โดยการซื้อผูกกับบัญชีร้านค้าของคุณ ไม่ใช่บัญชีของแอปนี้
        </p>
      </Section>

      <Section heading="3. ข้อมูลที่แอปใช้ และใช้เพื่ออะไร">
        <p>
          แอปขอสิทธิ์เข้าถึงข้อมูลต่อไปนี้ <strong>เฉพาะขณะที่คุณเปิดใช้งานฟีเจอร์นั้น ๆ</strong>{" "}
          และขอเมื่อถึงเวลาที่ต้องใช้จริงเท่านั้น คุณปฏิเสธได้ทุกรายการ
          โดยฟีเจอร์ที่ไม่เกี่ยวข้องยังใช้งานได้ตามปกติ
        </p>
        <Bullets
          items={[
            <>
              <strong>ตำแหน่งที่ตั้ง</strong> — ใช้แสดงตำแหน่งของคุณบนแผนที่
              ค้นหาสถานที่ในรัศมีรอบตัว และคำนวณเส้นทาง
              ใช้เฉพาะตอนที่แอปเปิดอยู่บนหน้าจอ{" "}
              <strong>แอปไม่ติดตามตำแหน่งขณะทำงานเบื้องหลัง</strong>{" "}
              และไม่เก็บประวัติการเดินทางของคุณ
            </>,
            <>
              <strong>กล้อง</strong> — ใช้ถ่ายภาพป้ายราคาหรือเมนูสำหรับฟีเจอร์สแกนราคา
              ภาพจะถูกส่งไปประมวลผลแล้วนำผลลัพธ์กลับมาแสดง
              เราไม่เก็บภาพถ่ายของคุณไว้ในระบบ
            </>,
            <>
              <strong>ไมโครโฟน</strong> — ใช้เฉพาะเมื่อคุณกดใช้ฟีเจอร์ช่วยเหลือด้วยเสียง
              เสียงจะถูกแปลงเป็นข้อความและแปลภาษา แล้วนำผลกลับมาแสดง
              เราไม่เก็บไฟล์เสียงของคุณไว้ในระบบ
            </>,
            <>
              <strong>ภาษาที่เลือก</strong> — เก็บไว้ในเครื่องของคุณ
              และส่งมาพร้อมข้อมูลการใช้งานตามข้อถัดไป
              เพื่อให้เราทราบว่าควรดูแลภาษาใดเป็นหลัก
            </>,
            <>
              <strong>รหัสประจำการติดตั้ง (Install ID) และข้อมูลการใช้งานพื้นฐาน</strong> —
              เมื่อเปิดแอป เราบันทึกรหัสสุ่มที่แอปสร้างขึ้นเองประจำการติดตั้งนั้น
              พร้อมกับวันที่เริ่มใช้งานครั้งแรก วันที่ใช้งานล่าสุด ระบบปฏิบัติการ
              เวอร์ชันของแอป ภาษาที่เลือก และสถานะ Premium
              เพื่อให้ผู้ดูแลระบบทราบจำนวนผู้ใช้งานและช่วยตรวจสอบปัญหาการซื้อได้{" "}
              <strong>
                รหัสนี้เป็นตัวเลขสุ่ม ไม่ได้มาจากหมายเลขเครื่อง หมายเลขโฆษณา หรือ IMEI
                และไม่ผูกกับชื่อหรืออีเมลใด ๆ
              </strong>{" "}
              หากคุณลบแอปแล้วติดตั้งใหม่ จะได้รหัสใหม่และรหัสเดิมจะไม่เชื่อมโยงกับคุณอีก
            </>,
          ]}
        />
      </Section>

      <Section heading="4. ข้อมูลการซื้อแพ็กเกจ">
        <p>
          การชำระเงินทั้งหมดดำเนินการโดย Google Play หรือ App Store
          เราไม่เห็นและไม่เก็บเลขบัตรหรือข้อมูลการชำระเงินของคุณ
        </p>
        <p>
          Premium จำหน่ายเป็น <strong>สมาชิกแบบต่ออายุอัตโนมัติ</strong>{" "}
          ทั้งแบบรายสัปดาห์และรายเดือน ร้านค้าจะเรียกเก็บเงินผ่านบัญชี Google Play
          หรือ Apple ID ของคุณ และต่ออายุให้อัตโนมัติจนกว่าคุณจะยกเลิก
          การยกเลิกทำที่หน้าตั้งค่าการสมัครสมาชิกของร้านค้า ไม่ได้ทำในแอปนี้
        </p>
        <p>
          เมื่อคุณสมัครสมาชิก เราบันทึกเพียง{" "}
          <strong>รหัสรายการซื้อที่ร้านค้าออกให้ ประเภทแพ็กเกจ และวันสิ้นสุดรอบปัจจุบัน</strong>{" "}
          เพื่อให้แอปแสดงสถานะได้ถูกต้องก่อนที่ร้านค้าจะตอบกลับ
          ข้อมูลชุดนี้ไม่มีชื่อ อีเมล หรือสิ่งใดที่ระบุตัวคุณได้
        </p>
        <p>
          นอกจากนี้ เราบันทึก{" "}
          <strong>ผลของทุกครั้งที่มีการพยายามซื้อ</strong> —
          ทั้งที่สำเร็จ ถูกยกเลิก ล้มเหลว หรือรอการชำระเงิน — พร้อมราคาที่ร้านค้าแจ้ง
          สกุลเงิน และรหัสประจำการติดตั้งตามข้อ 3
          เก็บไว้เพื่อให้เราตรวจสอบได้เมื่อคุณแจ้งว่าจ่ายเงินแล้วแต่ยังใช้งานไม่ได้
          <strong>เราไม่เห็นอีเมลของบัญชี Google Play หรือ Apple ID ของคุณ</strong>{" "}
          เพราะร้านค้าไม่ได้ส่งข้อมูลนั้นมาให้เรา
        </p>
      </Section>

      <Section heading="5. บริการภายนอกที่แอปเรียกใช้">
        <p>
          เมื่อคุณใช้ฟีเจอร์ที่เกี่ยวข้อง ข้อมูลเท่าที่จำเป็นจะถูกส่งไปยังผู้ให้บริการต่อไปนี้
          ซึ่งมีนโยบายความเป็นส่วนตัวของตนเอง
        </p>
        <Bullets
          items={[
            <>
              <strong>Google Maps Platform</strong> — แผนที่ การค้นหาตำแหน่ง และการคำนวณเส้นทาง
            </>,
            <>
              <strong>Google Cloud (Speech-to-Text และ Gemini)</strong> —
              แปลงเสียงเป็นข้อความ แปลภาษา และอ่านภาพจากกล้อง
            </>,
            <>
              <strong>Firebase (Google)</strong> —
              เก็บเนื้อหาของแอป ข้อมูลการใช้งานตามข้อ 3 และข้อมูลการซื้อตามข้อ 4
            </>,
            <>
              <strong>ผู้ให้บริการข่าวสาร</strong> — ข่าวแจ้งเตือนที่แสดงบนหน้าแรก
              โดยเป็นการดึงข้อมูลมาแสดงเท่านั้น ไม่มีการส่งข้อมูลของคุณออกไป
            </>,
            <>
              <strong>Google Play / App Store</strong> — การชำระเงินและการกู้คืนการซื้อ
            </>,
          ]}
        />
      </Section>

      <Section heading="6. สิ่งที่เราไม่ทำ">
        <Bullets
          items={[
            "ไม่ขายหรือให้เช่าข้อมูลของคุณแก่บุคคลที่สาม",
            "ไม่ติดตามตำแหน่งขณะแอปทำงานเบื้องหลัง",
            "ไม่เก็บประวัติการค้นหา ประวัติการสแกน หรือประวัติการเดินทางของคุณ",
            "ไม่แสดงโฆษณา และไม่ใช้เครื่องมือติดตามเพื่อการโฆษณา",
          ]}
        />
      </Section>

      <Section heading="7. สิทธิของคุณ">
        <p>
          ภายใต้ PDPA คุณมีสิทธิขอเข้าถึง แก้ไข ลบ หรือคัดค้านการประมวลผลข้อมูลส่วนบุคคลของคุณ
          เนื่องจากแอปไม่มีบัญชีผู้ใช้ ข้อมูลเกือบทั้งหมดอยู่ในเครื่องของคุณเอง
          คุณจึงลบได้ทันทีด้วยการล้างข้อมูลแอปหรือถอนการติดตั้ง
          ซึ่งจะทำให้รหัสประจำการติดตั้งเดิมไม่เชื่อมโยงกับคุณอีกต่อไป
          หากต้องการให้ลบข้อมูลการใช้งานตามข้อ 3 หรือข้อมูลการซื้อตามข้อ 4
          กรุณาติดต่อเราพร้อมแจ้งรหัสรายการซื้อ หรือรหัสประจำการติดตั้ง
          ซึ่งดูได้ที่หน้าโปรไฟล์ในแอป
        </p>
      </Section>

      <Section heading="8. เด็กและเยาวชน">
        <p>
          แอปนี้ออกแบบสำหรับนักท่องเที่ยวทั่วไป ไม่ได้มุ่งเป้าไปที่เด็กอายุต่ำกว่า 13 ปี
          และเราไม่ได้เก็บข้อมูลจากเด็กโดยเจตนา
        </p>
      </Section>

      <Section heading="9. การเปลี่ยนแปลงนโยบาย">
        <p>
          หากมีการแก้ไขนโยบายนี้ เราจะปรับวันที่ &quot;ปรับปรุงล่าสุด&quot; ด้านบน
          และเผยแพร่ฉบับใหม่บนหน้านี้
        </p>
      </Section>

      <Section heading="10. ข้อจำกัดความรับผิด">
        <p>
          ข้อมูลในแอปเป็นข้อมูลเพื่อประกอบการเดินทางเท่านั้น รวบรวมจากแหล่งข้อมูลสาธารณะ
          หน่วยงานที่เกี่ยวข้อง และพันธมิตรที่ผ่านการตรวจสอบ
          โดยอาจมีความคลาดเคลื่อนหรือไม่เป็นปัจจุบัน
          ผู้ใช้ควรใช้วิจารณญาณและตรวจสอบข้อมูลจากแหล่งอื่นประกอบการตัดสินใจ
        </p>
      </Section>
    </article>
  );
}

function EnglishPolicy() {
  return (
    <article id="en" className="scroll-mt-6">
      <h2 className="text-xl font-bold text-foreground">English</h2>

      <Section heading="1. Who operates this app">
        <p>
          The ThaiShield AI mobile app (&quot;the app&quot;) is operated by
          ThaiShield AI (&quot;we&quot;), the data controller under Thailand&apos;s
          Personal Data Protection Act B.E. 2562 (PDPA). Questions about this
          policy can be sent to{" "}
          <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section heading="2. There is no account system">
        <p>
          The app has no sign-up, no login and no user accounts. We hold no
          name, email address, phone number or profile for you, and we cannot
          identify an individual user.
        </p>
        <p>
          We do record a <strong>random identifier for each installation</strong>{" "}
          of the app, described in section 3. It lets us count how many
          installations there are and look into a purchase problem. It is not
          derived from your device or your store account and cannot be used to
          find out who you are.
        </p>
      </Section>

      <Section heading="3. What the app uses, and what for">
        <p>
          The app asks for the following <strong>only while you are using the
          feature that needs it</strong>, and only at the point it is needed. You
          may refuse any of them; unrelated features keep working.
        </p>
        <Bullets
          items={[
            <>
              <strong>Location</strong> — to show where you are on the map, list
              what is within a radius around you, and work out a route. Used
              only while the app is open on screen.{" "}
              <strong>The app does not track your location in the background</strong>{" "}
              and keeps no history of where you have been.
            </>,
            <>
              <strong>Camera</strong> — to photograph a price sign or menu for
              the price scanner. The image is sent for processing and the result
              is shown to you; we do not keep your photographs.
            </>,
            <>
              <strong>Microphone</strong> — only when you start the voice
              assistance feature. The audio is turned into text and translated,
              and the result is shown to you; we do not keep your recordings.
            </>,
            <>
              <strong>Language choice</strong> — stored on your device so the
              app remembers it, and included in the usage record below so we
              know which languages to support properly.
            </>,
            <>
              <strong>An installation identifier and basic usage data</strong> —
              when the app opens we record a random value the app generates for
              that installation, together with the date you first used it, the
              date you last used it, your operating system, the app version, the
              language you chose, and whether Premium is active. This is what
              tells the operator how many people are using the app and helps us
              investigate a purchase problem.{" "}
              <strong>
                The identifier is a random number. It is not your device id, not
                an advertising id, not an IMEI, and it is attached to no name or
                email address.
              </strong>{" "}
              Uninstalling and reinstalling produces a new one, and the old one
              is no longer connected to you.
            </>,
          ]}
        />
      </Section>

      <Section heading="4. Purchase data">
        <p>
          All payments are handled by Google Play or the App Store. We never see
          or store your card or payment details.
        </p>
        <p>
          Premium is sold as an <strong>auto-renewing subscription</strong>,
          weekly or monthly. The store charges your Google Play or Apple ID
          account, renews it automatically until you cancel, and handles
          cancellation in its own subscription settings — not in the app.
        </p>
        <p>
          When you subscribe we record only{" "}
          <strong>
            the transaction id issued by the store, which plan it was, and the
            end of the current period
          </strong>
          , so the app can show the right state before the store has answered.
          That record contains no name, no email, and nothing that identifies
          you.
        </p>
        <p>
          We also record <strong>the outcome of every purchase attempt</strong> —
          completed, cancelled, failed, or awaiting payment — with the price and
          currency the store quoted and the installation identifier from section
          3. This is kept so that we can check what happened if you tell us you
          paid and did not get access.{" "}
          <strong>
            We do not see the email address of your Google Play or Apple ID
            account
          </strong>
          , because neither store gives it to us.
        </p>
      </Section>

      <Section heading="5. Third-party services">
        <p>
          When you use the relevant feature, the minimum data needed is sent to
          these providers, each of which has its own privacy policy.
        </p>
        <Bullets
          items={[
            <>
              <strong>Google Maps Platform</strong> — maps, place lookup and
              route calculation.
            </>,
            <>
              <strong>Google Cloud (Speech-to-Text and Gemini)</strong> — speech
              recognition, translation, and reading text from a photo.
            </>,
            <>
              <strong>Firebase (Google)</strong> — app content, the usage
              record described in section 3, and the purchase records described
              in section 4.
            </>,
            <>
              <strong>A news provider</strong> — the travel notices shown on the
              home screen. Content is fetched for display; nothing about you is
              sent.
            </>,
            <>
              <strong>Google Play / App Store</strong> — payments and restoring
              a purchase.
            </>,
          ]}
        />
      </Section>

      <Section heading="6. What we do not do">
        <Bullets
          items={[
            "We do not sell or rent your data to anyone.",
            "We do not track your location while the app is in the background.",
            "We keep no search history, scan history or travel history.",
            "We show no advertising and use no advertising trackers.",
          ]}
        />
      </Section>

      <Section heading="7. Your rights">
        <p>
          Under the PDPA you may request access to, correction of, deletion of,
          or object to the processing of your personal data. Because the app has
          no account system, almost everything is held on your own device and
          you can remove it immediately by clearing the app&apos;s data or
          uninstalling it — which also leaves the old installation identifier
          connected to nobody. To have a usage record from section 3 or a
          purchase record from section 4 deleted, contact us and quote the
          transaction id, or the installation identifier shown on the
          app&apos;s Profile screen.
        </p>
      </Section>

      <Section heading="8. Children">
        <p>
          The app is intended for general travellers. It is not directed at
          children under 13, and we do not knowingly collect data from children.
        </p>
      </Section>

      <Section heading="9. Changes to this policy">
        <p>
          If this policy changes we will update the &quot;last updated&quot; date
          above and publish the new version on this page.
        </p>
      </Section>

      <Section heading="10. Disclaimer">
        <p>
          Information in the app is provided to help you plan travel. It is
          compiled from public sources, relevant authorities and verified
          partners, and may be incomplete or out of date. Please use your own
          judgement and check other sources before making decisions.
        </p>
      </Section>
    </article>
  );
}
