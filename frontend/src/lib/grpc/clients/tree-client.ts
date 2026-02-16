import { createClient } from "@connectrpc/connect";
import { TreeService } from "@/gen/tree/v1/tree_pb";
import { transport } from "../client";

export const treeClient = createClient(TreeService, transport);