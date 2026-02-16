import { createConnectTransport } from "@connectrpc/connect-web";

export const transport = createConnectTransport({
  baseUrl: process.env.NEXT_PUBLIC_GRPC_URL || "http://localhost:8080",
});