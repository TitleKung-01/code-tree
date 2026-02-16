import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
      {error ? (
        <p className="mt-4 text-red-500">❌ Error: {error.message}</p>
      ) : (
        <p className="mt-4 text-green-500">✅ Supabase Connected!</p>
      )}
      <pre className="mt-4 rounded bg-gray-100 p-4 text-sm">
        {JSON.stringify({ session: data.session ? "exists" : "none" }, null, 2)}
      </pre>
    </div>
  );
}