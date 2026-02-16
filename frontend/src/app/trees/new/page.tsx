"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTree } from "@/hooks/use-trees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  TreePine,
  Loader2,
  Sparkles,
  Building2,
  FileText,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NewTreePage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { createTree, loading } = useCreateTree();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const treeId = await createTree({
      name: name.trim(),
      description: description.trim(),
      faculty: faculty.trim(),
      department: department.trim(),
    });

    if (treeId) {
      router.push(`/trees/${treeId}`);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/trees"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้ารายการ
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5">
          {/* Accent top */}
          <div className="h-1 bg-linear-to-r from-green-500 to-emerald-400" />

          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/5">
                <TreePine className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">สร้างสายรหัสใหม่</CardTitle>
                <CardDescription>
                  กรอกข้อมูลเพื่อสร้างต้นไม้สายรหัส
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ชื่อ — primary field */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    ชื่อสายรหัส <span className="text-red-500">*</span>
                  </span>
                </Label>
                <Input
                  id="name"
                  placeholder="เช่น สายรหัส 67"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    คำอธิบาย
                  </span>
                </Label>
                <Input
                  id="description"
                  placeholder="เช่น สายรหัสรุ่นที่ 67 ภาควิชาวิศวกรรมคอมพิวเตอร์"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                />
              </div>

              {/* คณะ + ภาค */}
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  ข้อมูลสถาบัน (ไม่บังคับ)
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="faculty" className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        คณะ
                      </span>
                    </Label>
                    <Input
                      id="faculty"
                      placeholder="เช่น คณะวิศวกรรมศาสตร์"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      className="bg-background transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        ภาควิชา
                      </span>
                    </Label>
                    <Input
                      id="department"
                      placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="bg-background transition-shadow focus-visible:ring-2 focus-visible:ring-green-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-muted-foreground"
                  onClick={() => router.back()}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2 bg-linear-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/20"
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    <>
                      <TreePine className="h-4 w-4" />
                      สร้างสายรหัส
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
