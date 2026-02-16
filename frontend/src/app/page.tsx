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
} from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-green-100/50 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          ระบบจัดเรียงพี่น้องสายรหัส
        </motion.div>

        {/* Logo */}
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
          className="text-5xl font-bold tracking-tight sm:text-6xl"
        >
          Code{" "}
          <span className="bg-linear-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Tree
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground"
        >
          สร้างและจัดการต้นไม้สายรหัสได้ง่ายๆ ด้วยระบบ Drag & Drop
          เห็นภาพรวมทั้งสายในที่เดียว
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-8 flex justify-center gap-3"
        >
          <Link href="/register">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
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
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="outline" className="gap-2">
                เข้าสู่ระบบ
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
          variants={stagger}
        >
          <FeatureCard
            icon={<MousePointerClick className="h-5 w-5" />}
            title="Drag & Drop"
            description="ลากย้ายสายรหัสได้ง่ายๆ สะดวก รวดเร็ว"
            color="blue"
          />
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" />}
            title="Visualize"
            description="เห็นภาพรวมสายรหัสทั้งหมดแบบ real-time"
            color="green"
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="จัดการง่าย"
            description="เพิ่ม แก้ไข ลบ ตัดสาย ต่อสาย ได้ครบ"
            color="purple"
          />
        </motion.div>
      </motion.div>
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
      className={`group rounded-2xl border bg-linear-to-b p-5 transition-colors ${colorMap[color]}`}
    >
      <div
        className={`mb-3 inline-flex rounded-xl p-2.5 ${iconBg[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}