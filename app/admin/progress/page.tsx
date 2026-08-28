import { Check, Circle, Clock, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "ความคืบหน้าโครงการ",
};

/**
 * A status page for the client's own team, so "where are we" has an answer
 * that does not require asking the developer.
 *
 * Deliberately no money on this page. Payment milestones are between the
 * client and the developer; staff who log in here to edit prices have no
 * reason to see them, and a figure on a shared screen is the kind of thing
 * that gets screenshotted out of context.
 *
 * 🚨 This is hand-maintained. Update it when a phase actually moves — a status
 * page that quietly goes stale is worse than none, because people stop
 * checking with the developer and start trusting it.
 */
type Status = "done" | "active" | "todo";

interface Phase {
  name: string;
  status: Status;
  summary: string;
  items: { label: string; done: boolean }[];
}

const PHASES: Phase[] = [
  {
    name: "ระบบหลังบ้าน (เว็บนี้)",
    status: "done",
    summary: "ส่งมอบและใช้งานจริงแล้ว — คือหน้าที่คุณกำลังเปิดอยู่",
    items: [
      { label: "จัดการช่วงราคามาตรฐาน", done: true },
      { label: "จัดการหมุดร้านพันธมิตร พร้อมอัปโหลดรูป", done: true },
      { label: "วาดและแก้ไขพื้นที่แจ้งเตือนบนแผนที่", done: true },
      { label: "เข้าสู่ระบบด้วยบัญชี Google เฉพาะทีมงาน", done: true },
      { label: "หน้านโยบายความเป็นส่วนตัวสำหรับยื่นสโตร์", done: true },
    ],
  },
  {
    name: "เฟส 2A — เรดาร์ความปลอดภัยและตัวกรอง",
    status: "done",
    summary: "ส่งมอบแล้ว",
    items: [
      { label: "ค้นหาสิ่งที่อยู่รอบตัวในรัศมีที่เลือก", done: true },
      { label: "การ์ดเตือนเมื่ออยู่ใกล้พื้นที่แจ้งเตือน", done: true },
      { label: "ตัวกรองตามหมวดหมู่ และขยายประเภทร้านจาก 3 เป็น 11 แบบ", done: true },
    ],
  },
  {
    name: "เฟส 2B — เส้นทางแนะนำและหน้าแพ็กเกจ",
    status: "done",
    summary:
      "ส่งมอบ 28/08/2026 · ทดสอบบนเครื่องจำลองครบแล้ว เหลือให้ทีมงานลองบนมือถือจริง",
    items: [
      { label: "เส้นทางแนะนำ พร้อมโหมดรถยนต์ / ขนส่งสาธารณะ / เดิน", done: true },
      { label: "ส่งต่อไปเปิดใน Google Maps", done: true },
      { label: "หน้าเสนอแพ็กเกจ และการล็อกฟีเจอร์สำหรับผู้ใช้ทั่วไป", done: true },
      { label: "ทดลองใช้ฟรี 3 วันสำหรับผู้ใช้ใหม่", done: true },
      { label: "ย้ายข้อมูลรอบตัวคุณเข้ามาไว้ในหน้าแผนที่", done: true },
    ],
  },
  {
    name: "เฟส 2C — ระบบชำระเงินและเตรียมขึ้นสโตร์",
    status: "active",
    summary: "กำลังดำเนินการ — เป็นเฟสสุดท้ายก่อนเปิดใช้งานจริง",
    items: [
      { label: "ตรวจสำนวนข้อความให้ครบทั้ง 6 ภาษา", done: false },
      { label: "เชื่อมระบบชำระเงินของ Google Play และ App Store", done: false },
      { label: "ปุ่มกู้คืนการซื้อสำหรับผู้ที่เปลี่ยนเครื่อง", done: false },
      { label: "ทดสอบรวมทั้งระบบ และสร้างไฟล์สำหรับขึ้นสโตร์", done: false },
      { label: "ทดสอบบน iPhone (ยังไม่เคยทดสอบเลย)", done: false },
    ],
  },
];

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  done: {
    label: "เสร็จแล้ว",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  active: {
    label: "กำลังทำ",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  todo: {
    label: "ยังไม่เริ่ม",
    className: "bg-muted text-muted-foreground ring-border",
  },
};

/** Things the developer cannot finish alone. Being specific is the point. */
const WAITING = [
  "ผู้ทดสอบในระบบ Google Play ยังไม่ครบ 12 คน — เป็นเงื่อนไขของ Google ที่ต้องครบก่อนเปิดขายจริง",
  "บัญชีธนาคารสำหรับรับเงินจากสโตร์ ต้องดำเนินการตอนกลับถึงไทย ราวเดือนพฤศจิกายน",
  "ทดลองใช้แอปบนมือถือจริง แล้วแจ้งกลับว่าส่วนไหนใช้งานไม่สะดวก",
];

export default function ProgressPage() {
  return (
    <>
      <PageHeader
        title="ความคืบหน้าโครงการ"
        description="สถานะงานแต่ละเฟส อัปเดตล่าสุด 28 สิงหาคม 2026"
      />

      <div className="space-y-4">
        {PHASES.map((phase) => {
          const style = STATUS_STYLE[phase.status];
          return (
            <Card key={phase.name}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-base">{phase.name}</CardTitle>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {phase.summary}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {phase.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-2 text-sm"
                    >
                      {item.done ? (
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"
                          aria-hidden
                        />
                      )}
                      <span
                        className={
                          item.done ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-amber-700" aria-hidden />
            รอจากฝั่งลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {WAITING.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-600" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Saying what is *not* covered matters more on a status page than
          anywhere else, because a green list quietly implies everything is
          proven and none of this is. */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TriangleAlert className="size-4 text-muted-foreground" aria-hidden />
            สิ่งที่ยังไม่ได้ทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            รายการที่ขึ้นว่าเสร็จแล้วข้างบน หมายถึงเขียนเสร็จและทดสอบบนเครื่องจำลองแล้ว
            สิ่งต่อไปนี้ยังไม่เคยทดสอบบนอุปกรณ์จริง จึงยังไม่นับว่าผ่าน
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>กล้องถ่ายรูปสำหรับสแกนราคาจากเมนูจริง</li>
            <li>ไมโครโฟนสำหรับ SOS ด้วยเสียง ทั้ง 6 ภาษา</li>
            <li>ตำแหน่ง GPS ขณะเดินทางจริง</li>
            <li>ระบบตัดเงินจริง (ยังไม่ได้เชื่อม อยู่ในเฟส 2C)</li>
            <li>ทุกอย่างบน iPhone</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
