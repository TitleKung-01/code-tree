import { createClient } from "@connectrpc/connect";
import { NodeService } from "@/gen/node/v1/node_pb";
import { transport } from "../client";

export const nodeClient = createClient(NodeService, transport);