import { createConnectTransport } from "@connectrpc/connect-web";
import { type Interceptor } from "@connectrpc/connect";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

// Interceptor: แนบ JWT token ทุก request
const authInterceptor: Interceptor = (next) => async (req) => {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (data.session?.access_token) {
    req.header.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  return next(req);
};

// Transport
export const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_GRPC_URL || "http://localhost:8080",
  interceptors: [authInterceptor],
});