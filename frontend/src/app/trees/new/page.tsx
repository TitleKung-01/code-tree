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
import { ArrowLeft, TreePine, Loader2 } from "lucide-react";

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
      <Link
        href="/trees"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้ารายการ
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <TreePine className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>สร้างสายรหัสใหม่</CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อสร้างต้นไม้สายรหัส</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อสายรหัส *</Label>
              <Input
                id="name"
                placeholder="เช่น สายรหัส 67"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Input
                id="description"
                placeholder="เช่น สายรหัสรุ่นที่ 67 ภาควิชาวิศวกรรมคอมพิวเตอร์"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="faculty">คณะ</Label>
              <Input
                id="faculty"
                placeholder="เช่น คณะวิศวกรรมศาสตร์"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">ภาควิชา</Label>
              <Input
                id="department"
                placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2"
                disabled={loading || !name.trim()}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "กำลังสร้าง..." : "สร้างสายรหัส"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
