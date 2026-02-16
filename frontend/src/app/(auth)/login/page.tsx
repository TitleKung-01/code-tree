"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { TreePine } from "lucide-react";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: error.message,
      });
      setLoading(false);
      return;
    }

    toast.success("เข้าสู่ระบบสำเร็จ!");
    router.push("/trees");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-green-50/50 via-background to-emerald-50/50 px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-green-100/40 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 bottom-1/4 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full border-0 shadow-xl shadow-black/5">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
              <TreePine className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">ยินดีต้อนรับกลับ</CardTitle>
            <CardDescription>เข้าสู่ระบบเพื่อจัดการสายรหัสของคุณ</CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="pl-10 transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full gap-2 bg-linear-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/20 transition-all hover:shadow-xl hover:shadow-green-500/25"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ยังไม่มีบัญชี?{" "}
                <Link
                  href="/register"
                  className="font-medium text-green-600 transition-colors hover:text-green-700 hover:underline"
                >
                  สมัครสมาชิก
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}