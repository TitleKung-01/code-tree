import Link from "next/link";
import { TreePine, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600">
                <TreePine className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Code <span className="text-green-600">Tree</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              ระบบจัดเรียงพี่น้องสายรหัส แบบ Drag & Drop
              เห็นภาพรวมทั้งสายในที่เดียว
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">ลิงก์</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  เข้าสู่ระบบ
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  สมัครสมาชิก
                </Link>
              </li>
              <li>
                <Link
                  href="/trees"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  สายรหัสของฉัน
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">ข้อมูล</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  บันทึกการอัปเดต
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  สถานะระบบ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">เทคโนโลยี</h3>
            <ul className="mt-3 space-y-2">
              <li className="text-sm text-muted-foreground">Next.js</li>
              <li className="text-sm text-muted-foreground">Go (gRPC)</li>
              <li className="text-sm text-muted-foreground">PostgreSQL</li>
              <li className="text-sm text-muted-foreground">Supabase Auth</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            สร้างด้วย <Heart className="h-3.5 w-3.5 text-red-500" /> โดยทีม
            Code Tree
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Code Tree. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
