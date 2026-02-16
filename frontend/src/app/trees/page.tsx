import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TreesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ถ้าไม่ได้ login → redirect ไปหน้า login
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">สายรหัสของฉัน</h1>
          <p className="text-muted-foreground">
            สวัสดี, {user.user_metadata?.display_name || user.email}
          </p>
        </div>
      </div>

      {/* Placeholder — Day 6 จะทำหน้านี้จริง */}
      <div className="mt-8 rounded-lg border-2 border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          ✅ Protected Route ทำงานแล้ว!
          <br />
          📅 Day 6 จะเพิ่ม Tree listing + Create Tree ที่นี่Kun
        </p>
      </div>
    </div>
  );
}