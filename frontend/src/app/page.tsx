import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TreePine, MousePointerClick, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100">
          <TreePine className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight">Code Tree</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          ระบบจัดเรียงพี่น้องสายรหัส แบบ Drag & Drop
          สร้างและจัดการต้นไม้สายรหัสได้ง่ายๆ
        </p>

        {/* Features */}
        <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <MousePointerClick className="mx-auto h-6 w-6 text-green-600" />
            <p className="mt-2 text-sm font-medium">Drag & Drop</p>
            <p className="text-xs text-muted-foreground">ลากย้ายสายได้เลย</p>
          </div>
          <div className="rounded-lg border p-4">
            <TreePine className="mx-auto h-6 w-6 text-green-600" />
            <p className="mt-2 text-sm font-medium">Visualize</p>
            <p className="text-xs text-muted-foreground">เห็นภาพรวมสายรหัส</p>
          </div>
          <div className="rounded-lg border p-4">
            <Users className="mx-auto h-6 w-6 text-green-600" />
            <p className="mt-2 text-sm font-medium">จัดการง่าย</p>
            <p className="text-xs text-muted-foreground">
              เพิ่ม/แก้ไข/ลบ ได้
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg">เริ่มต้นใช้งาน</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              เข้าสู่ระบบ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}