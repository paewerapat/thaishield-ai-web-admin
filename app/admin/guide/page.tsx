import { AlertTriangle, Ban, CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Written in Thai on purpose: the people who need a manual for this admin are
 * the client's Thai-speaking staff, not the developer. The rest of the admin
 * chrome stays English because that is what it already was — mixing is worse
 * than either, but retranslating every existing screen was not the ask.
 */
export const metadata = {
  title: "คู่มือการใช้งาน",
};

/** §10 of the project rules, in the form staff actually need: what to type. */
const WORDING = [
  { avoid: "โกง / หลอกลวง / ต้มตุ๋น", use: "แจ้งเตือนการเดินทาง" },
  { avoid: "ร้านนี้โกงราคา", use: "ราคาสูงกว่าช่วงราคาทั่วไป" },
  { avoid: "ราคาแพงเกินจริง", use: "สูงกว่าค่าเฉลี่ยในพื้นที่" },
  { avoid: "อย่าไปร้านนี้", use: "เปรียบเทียบราคาก่อนตัดสินใจ" },
  { avoid: "พื้นที่อันตราย", use: "พื้นที่คำแนะนำสำหรับนักท่องเที่ยว" },
  { avoid: "แหล่งหลอกนักท่องเที่ยว", use: "พื้นที่ที่ชุมชนแจ้งเตือน" },
  { avoid: "รับประกันราคายุติธรรม", use: "ราคามาตรฐานที่รับรอง" },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="คู่มือการใช้งาน"
        description="ระบบหลังบ้านนี้แก้ข้อมูลที่แอปบนมือถือดึงไปแสดงโดยตรง แก้แล้วมีผลทันที ไม่ต้องรอรอบอัปเดตแอป"
      />

      {/* The single most important thing on this page, so it opens the page
          rather than sitting at the bottom where nobody scrolls to. */}
      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-700" aria-hidden />
            กฎการเขียนข้อความ — สำคัญที่สุด
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            ข้อความที่พิมพ์ในระบบนี้จะไปปรากฏต่อนักท่องเที่ยวจริง และอาจพาดพิงถึงร้านค้าหรือพื้นที่ที่ระบุตัวได้
            แอปนี้มีหน้าที่ <strong className="text-foreground">ให้ข้อมูลเพื่อให้ผู้ใช้ตัดสินใจเอง</strong>{" "}
            ไม่ใช่ตัดสินหรือกล่าวหาใคร การเขียนกล่าวหาร้านที่ระบุชื่อได้อาจนำไปสู่การถูกฟ้องหมิ่นประมาท
          </p>

          <div className="overflow-x-auto rounded-md border border-warning/30 bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">ห้ามเขียน</th>
                  <th className="px-3 py-2 font-medium">ให้เขียนแทน</th>
                </tr>
              </thead>
              <tbody>
                {WORDING.map((row) => (
                  <tr key={row.avoid} className="border-b last:border-0">
                    <td className="px-3 py-2 align-top text-destructive">
                      <span className="flex items-start gap-1.5">
                        <Ban className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {row.avoid}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-foreground">
                      <span className="flex items-start gap-1.5">
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                        {row.use}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-md bg-destructive/5 px-3 py-2 text-destructive">
            <strong>ระบบตรวจให้อัตโนมัติเฉพาะข้อความภาษาอังกฤษ</strong> —
            ข้อความภาษาไทยที่พิมพ์เอง ไม่มีอะไรตรวจให้ ต้องอ่านทวนเองก่อนบันทึกทุกครั้ง
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">
        เมนูแต่ละอันแก้อะไร
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Price Standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              ช่วงราคาปกติของอาหารและบริการ ใช้เป็นตัวเทียบตอนผู้ใช้สแกนเมนูหรือป้ายราคา
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                กรอกชื่อให้ครบ <strong>ทั้ง 6 ภาษา</strong> ถ้าเว้นว่าง
                ผู้ใช้ภาษานั้นจะเห็นเป็นภาษาอังกฤษแทน
              </li>
              <li>
                รหัส (id) ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดล่างเท่านั้น เช่น{" "}
                <code className="rounded bg-muted px-1">pad_thai</code>
              </li>
              <li>
                <strong>ตั้งรหัสแล้วเปลี่ยนไม่ได้</strong> ถ้าตั้งผิดต้องลบแล้วสร้างใหม่
              </li>
              <li>ราคาต่ำสุดต้องน้อยกว่าราคาสูงสุด และเป็นหน่วยบาท</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Partner Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>หมุดร้านค้าและสถานที่ที่แสดงบนหน้าแผนที่ของแอป</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>ประเภท (type)</strong> มี 11 แบบ เลือกจากรายการเท่านั้น
                ห้ามพิมพ์เอง เพราะแอปรู้จักเฉพาะค่าที่กำหนดไว้
              </li>
              <li>
                <strong>ระดับราคา</strong> — เลือก fair เมื่อราคาอยู่ในช่วงปกติ ·
                caution / high จะทำให้แอปขึ้นป้าย &ldquo;สูงกว่าช่วงราคาทั่วไป&rdquo;
              </li>
              <li>
                <strong>รับรองแล้ว (verified)</strong> ติ๊กเมื่อทีมงานตรวจสอบราคาจริงแล้ว
                แอปจะขึ้นป้าย &ldquo;ราคามาตรฐานที่รับรอง&rdquo; —
                อย่าติ๊กถ้ายังไม่ได้ตรวจ
              </li>
              <li>รูปภาพอัปโหลดได้เลย ถ้าไม่ใส่ แอปจะแสดงไอคอนตามประเภทแทน</li>
              <li>พิกัดต้องตรงกับตำแหน่งจริง เพราะแอปใช้คำนวณระยะทางและเส้นทาง</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alert Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>พื้นที่บนแผนที่ที่ระบายสีไว้ วาดขอบเขตเองได้จากแผนที่</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>safe</strong> เขียว · <strong>caution</strong> เหลือง ·{" "}
                <strong>danger</strong> แดง
              </li>
              <li>
                คำอธิบายคือข้อความที่นักท่องเที่ยวอ่านโดยตรง —
                จุดที่กฎการเขียนข้างบนสำคัญที่สุด
              </li>
              <li>
                วาดกรอบให้ครอบเฉพาะพื้นที่ที่ตั้งใจ ถ้าวาดเกินไปโดนถนนหรือย่านข้างเคียง
                คนที่อยู่ตรงนั้นจะได้รับการแจ้งเตือนไปด้วย
              </li>
              <li>ระบบคำนวณจุดกึ่งกลางและรัศมีให้เอง ไม่ต้องกรอก</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">
        ข้อควรระวัง
      </h2>

      <Card>
        <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">แก้แล้วมีผลทันที</strong> —
              ไม่มีขั้นตอนตรวจทานก่อนเผยแพร่ และไม่มีปุ่มย้อนกลับ
              ผู้ใช้ที่เปิดแอปอยู่จะเห็นข้อมูลใหม่ในการโหลดครั้งถัดไป
              อ่านทวนก่อนกดบันทึกเสมอ
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">การลบไม่มีถังขยะ</strong> —
              ลบแล้วหายถาวร ถ้าไม่แน่ใจให้แก้ไขแทนการลบ
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">ข่าวแจ้งเตือนในแอปไม่ได้แก้จากที่นี่</strong>{" "}
              — ระบบดึงมาจากสำนักข่าวอัตโนมัติทุก 10 นาที
              ถ้าเห็นข่าวที่ไม่เกี่ยวข้องให้แจ้งผู้พัฒนา ไม่ต้องหาที่ลบในระบบนี้
            </span>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
