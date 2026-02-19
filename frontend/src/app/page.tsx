"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TreePine,
  MousePointerClick,
  Users,
  ArrowRight,
  Sparkles,
  GitBranch,
  Share2,
  Zap,
  Shield,
  Newspaper,
} from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-green-100/60 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-100/30 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        <motion.div
          className="relative z-10 text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            ระบบจัดเรียงพี่น้องสายรหัส
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20"
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <TreePine className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Code{" "}
            <span className="bg-linear-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              Tree
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            สร้างและจัดการต้นไม้สายรหัสได้ง่ายๆ ด้วยระบบ Drag & Drop
            เห็นภาพรวมทั้งสายในที่เดียว
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="gap-2 bg-linear-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/25 transition-shadow hover:shadow-xl hover:shadow-green-500/30"
                >
                  เริ่มต้นใช้งาน
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button size="lg" variant="outline" className="gap-2">
                  เข้าสู่ระบบ
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-muted-foreground/60"
          >
            <span className="text-xs">เลื่อนลง</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="opacity-60"
            >
              <path
                d="M10 4v12m0 0l-4-4m4 4l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="border-t bg-muted/20 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              ทำไมต้อง Code Tree?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-3 max-w-lg text-muted-foreground"
            >
              เครื่องมือที่ออกแบบมาเพื่อให้จัดการสายรหัสเป็นเรื่องง่าย
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <FeatureCard
              icon={<MousePointerClick className="h-5 w-5" />}
              title="Drag & Drop"
              description="ลากย้ายสายรหัสได้ง่ายๆ สะดวก รวดเร็ว ไม่ต้องพิมพ์อะไรมาก"
              color="blue"
            />
            <FeatureCard
              icon={<GitBranch className="h-5 w-5" />}
              title="Visualize"
              description="เห็นภาพรวมสายรหัสทั้งหมดแบบ real-time ในรูปแบบ tree"
              color="green"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="จัดการง่าย"
              description="เพิ่ม แก้ไข ลบ ตัดสาย ต่อสาย ได้ครบจบในที่เดียว"
              color="purple"
            />
            <FeatureCard
              icon={<Share2 className="h-5 w-5" />}
              title="แชร์ได้"
              description="สร้างลิงก์แชร์สายรหัสให้คนอื่นดูได้ง่ายๆ ไม่ต้องมีบัญชี"
              color="blue"
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="เร็วทันใจ"
              description="ระบบหลังบ้านเขียนด้วย Go + gRPC ทำให้ทุกอย่างเร็วมาก"
              color="green"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="ปลอดภัย"
              description="ระบบ Authentication จาก Supabase ข้อมูลถูกเก็บอย่างปลอดภัย"
              color="purple"
            />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              ใช้งานง่ายใน 3 ขั้นตอน
            </motion.h2>
          </motion.div>

          <motion.div
            className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                step: "01",
                title: "สมัครสมาชิก",
                desc: "สร้างบัญชีผู้ใช้ด้วยอีเมลและรหัสผ่าน ใช้เวลาไม่ถึงนาที",
              },
              {
                step: "02",
                title: "สร้าง Tree",
                desc: "ตั้งชื่อสายรหัสแล้วเริ่มเพิ่มสมาชิกลงไปได้เลย",
              },
              {
                step: "03",
                title: "จัดการ & แชร์",
                desc: "ลากย้าย เพิ่ม ลบ ตัดต่อสาย แล้วแชร์ให้คนอื่นได้",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border bg-background p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-emerald-600 text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Blog CTA ── */}
      <section className="border-t bg-muted/20 px-4 py-16">
        <motion.div
          className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
          >
            <Newspaper className="h-3.5 w-3.5" />
            อัปเดตล่าสุด
          </motion.div>
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            ติดตามการอัปเดต & การแก้บัก
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-lg text-muted-foreground"
          >
            ดูว่าเราปรับปรุงอะไรไป แก้บักอะไร และเพิ่มฟีเจอร์อะไรใหม่
            ได้ที่หน้า Blog
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Link href="/blog">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button variant="outline" className="gap-2">
                  ดูบันทึกการอัปเดต
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            พร้อมจัดการสายรหัสแล้วหรือยัง?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-3 max-w-md text-muted-foreground"
          >
            เริ่มต้นใช้งานฟรี ไม่มีค่าใช้จ่าย สร้างบัญชีแล้วเริ่มจัดการสายรหัสได้เลย
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link href="/register">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="gap-2 bg-linear-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/25 transition-shadow hover:shadow-xl hover:shadow-green-500/30"
                >
                  สมัครสมาชิกฟรี
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "blue" | "green" | "purple";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400",
    green:
      "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400",
    purple:
      "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400",
  };

  const iconBg = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  };

  return (
    <motion.div
      variants={fadeUp}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      className={`group rounded-2xl border bg-linear-to-b p-6 transition-colors ${colorMap[color]}`}
    >
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${iconBg[color]}`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}
