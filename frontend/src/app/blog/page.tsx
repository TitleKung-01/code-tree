"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import {
  Bug,
  Sparkles,
  Wrench,
  ArrowLeft,
  Calendar,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EntryType = "fix" | "update" | "new";

interface ChangelogEntry {
  date: string;
  version?: string;
  items: {
    type: EntryType;
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  
  {
    date: "2026-02-19",
    version: "v1.4.0",
    items: [
      { type: "new", text: "เพิ่มหน้า Blog สำหรับบันทึกการอัปเดตและแก้บัก" },
      { type: "update", text: "ปรับปรุงหน้า Home ใหม่ เพิ่ม section ต่างๆ และ footer" },
      { type: "update", text: "เพิ่มลิงก์ Blog ใน Navbar" },
    ],
  },
  {
    date: "2026-02-18",
    version: "v1.3.2",
    items: [
      { type: "fix", text: "แก้บัก node ไม่แสดงผลเมื่อมีชื่อยาวเกินไป" },
      { type: "fix", text: "แก้ปัญหา drag & drop ไม่ทำงานบน mobile" },
      { type: "update", text: "ปรับปรุง UI ของ tree toolbar ให้ใช้งานง่ายขึ้น" },
    ],
  },
  {
    date: "2026-02-15",
    version: "v1.3.0",
    items: [
      { type: "new", text: "เพิ่มระบบแชร์ tree ผ่านลิงก์ (share link)" },
      { type: "new", text: "เพิ่มหน้า Status สำหรับดูสถานะระบบ" },
      { type: "update", text: "ปรับปรุง performance การโหลด tree ขนาดใหญ่" },
      { type: "fix", text: "แก้บัก layout เพี้ยนเมื่อ zoom out" },
    ],
  },
  {
    date: "2026-02-10",
    version: "v1.2.0",
    items: [
      { type: "new", text: "เพิ่มฟีเจอร์ตัดสายและต่อสาย (cut & reconnect)" },
      { type: "update", text: "ปรับปรุงระบบ authentication ให้เสถียรขึ้น" },
      { type: "fix", text: "แก้บัก session หมดอายุแล้วไม่ redirect ไปหน้า login" },
    ],
  },
  {
    date: "2026-02-05",
    version: "v1.1.0",
    items: [
      { type: "new", text: "เพิ่มระบบ Drag & Drop สำหรับย้ายตำแหน่ง node" },
      { type: "update", text: "ปรับปรุง tree visualization ให้อ่านง่ายขึ้น" },
      { type: "fix", text: "แก้บัก node ซ้ำเมื่อกดเพิ่มเร็วๆ" },
    ],
  },
  {
    date: "2026-01-28",
    version: "v1.0.0",
    items: [
      { type: "new", text: "เปิดตัว Code Tree เวอร์ชันแรก!" },
      { type: "new", text: "ระบบสร้างและจัดการ tree" },
      { type: "new", text: "ระบบสมาชิก (สมัคร / เข้าสู่ระบบ)" },
      { type: "new", text: "Tree visualization ด้วย React Flow" },
    ],
  },
];

const typeConfig: Record<
  EntryType,
  { label: string; icon: typeof Bug; variant: "default" | "secondary" | "outline"; className: string }
> = {
  fix: {
    label: "แก้บัก",
    icon: Bug,
    variant: "outline",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400",
  },
  update: {
    label: "ปรับปรุง",
    icon: Wrench,
    variant: "outline",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-400",
  },
  new: {
    label: "ใหม่",
    icon: Sparkles,
    variant: "outline",
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export default function BlogPage() {
  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              บันทึกการอัปเดต
            </h1>
            <p className="mt-2 text-muted-foreground">
              ประวัติการแก้บัก ปรับปรุง และเพิ่มฟีเจอร์ใหม่ทั้งหมดของ Code Tree
            </p>
          </motion.div>

          <div className="relative mt-10">
            <div className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border sm:block" />

            <div className="space-y-10">
              {changelog.map((entry) => (
                <motion.div
                  key={entry.date}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background sm:flex">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <time className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground sm:hidden" />
                          {formatDate(entry.date)}
                        </time>
                        {entry.version && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {entry.version}
                          </Badge>
                        )}
                      </div>

                      <ul className="mt-4 space-y-2.5">
                        {entry.items.map((item, i) => {
                          const config = typeConfig[item.type];
                          const Icon = config.icon;
                          return (
                            <li key={i} className="flex items-start gap-2.5">
                              <Badge
                                variant={config.variant}
                                className={`mt-0.5 shrink-0 gap-1 text-xs ${config.className}`}
                              >
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                              <span className="text-sm leading-relaxed text-foreground/90">
                                {item.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
