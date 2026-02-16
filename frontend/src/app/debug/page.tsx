"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function decodeJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { header, payload };
  } catch {
    return null;
  }
}

export default function DebugPage() {
  const [token, setToken] = useState("");
  const decoded = useMemo(() => (token ? decodeJWT(token) : null), [token]);

  useEffect(() => {
    const getToken = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setToken(data.session.access_token);
      }
    };
    getToken();
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold">Debug: JWT Token</h1>

      {token ? (
        <div className="mt-4">
          <p className="text-sm text-green-600">✅ Logged in!</p>
          <textarea
            className="mt-2 w-full rounded border p-2 font-mono text-xs"
            rows={6}
            value={token}
            readOnly
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
              navigator.clipboard.writeText(token);
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            คลิกเพื่อ copy
          </p>

          {decoded && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Header:</p>
                <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-sm font-medium">Payload:</p>
                <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-3 text-xs">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">ทดสอบ curl:</p>
            <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
{`curl -X POST http://localhost:8080/tree.v1.TreeService/CreateTree \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\
  -d '{"name":"สายรหัส CE 67","description":"ทดสอบ","faculty":"วิศวกรรม","department":"คอมพิวเตอร์"}'`}
            </pre>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-red-500">
          ❌ ยังไม่ได้ Login →{" "}
          <a href="/login" className="underline">Login ก่อน</a>
        </p>
      )}
    </div>
  );
}