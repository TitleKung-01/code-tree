"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TreePine,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { MorphingText } from "@/components/ui/morphing-text";

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

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <MorphingText
              texts={["Code Tree", "สายรหัส", "ต้นไม้โค้ด"]}
              className="h-14 text-5xl tracking-tight text-green-600 sm:h-20 sm:text-6xl lg:h-24 lg:text-7xl dark:text-green-400"
            />
          </motion.div>

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

        {/* <motion.div
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
        </motion.div> */}
      </section>
      <Footer />
    </div>
  );
}

