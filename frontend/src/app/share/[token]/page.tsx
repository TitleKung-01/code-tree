"use client";

import { useState, useCallback, useEffect, use } from "react";
import type { LayoutDirection } from "@/lib/tree/layout-engine";
import { ReactFlowProvider } from "@xyflow/react";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import TreeEditorInner from "@/components/tree/tree-editor-inner";
import TreeSearch from "@/components/tree/tree-search";
import { treeClient } from "@/lib/grpc/clients/tree-client";
import { nodeClient } from "@/lib/grpc/clients/node-client";
import { Node } from "@/gen/node/v1/node_pb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search,
  LayoutGrid,
  Maximize,
  ArrowDownUp,
  ArrowLeftRight,
  Users,
  GitBranch,
  Table2,
  Eye,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useReactFlow } from "@xyflow/react";
import { motion } from "framer-motion";

// ==================== Proto → TreeNodeData ====================

function protoToTreeNode(n: Node): TreeNodeData {
  const parentIds =
    n.parentIds.length > 0
      ? n.parentIds
      : n.parentId
        ? [n.parentId]
        : [];

  return {
    id: n.id,
    parentIds,
    nickname: n.nickname,
    firstName: n.firstName || "",
    lastName: n.lastName || "",
    studentId: n.studentId || "",
    generation: n.generation,
    photoUrl: n.photoUrl || "",
    status: mapProtoStatus(n.status),
    siblingOrder: n.siblingOrder || 0,
    phone: n.phone || "",
    email: n.email || "",
    lineId: n.lineId || "",
    discord: n.discord || "",
    facebook: n.facebook || "",
  };
}

function mapProtoStatus(status: number): "studying" | "graduated" | "retired" {
  switch (status) {
    case 2:
      return "graduated";
    case 3:
      return "retired";
    default:
      return "studying";
  }
}

// ==================== Page ====================

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { token } = use(params);

  return (
    <ReactFlowProvider>
      <ShareViewContent token={token} />
    </ReactFlowProvider>
  );
}

// ==================== Content ====================

interface TreeData {
  id: string;
  name: string;
  description: string;
  faculty: string;
  department: string;
}

function ShareViewContent({ token }: { token: string }) {
  const [tree, setTree] = useState<TreeData | null>(null);
  const [nodes, setNodes] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [direction, setDirection] = useState<LayoutDirection>("TB");

  // Fetch tree + nodes by share token
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [treeRes, nodesRes] = await Promise.all([
        treeClient.getTreeByShareToken({ shareToken: token }),
        nodeClient.getNodesByShareToken({ shareToken: token }),
      ]);

      if (treeRes.tree) {
        setTree({
          id: treeRes.tree.id,
          name: treeRes.tree.name,
          description: treeRes.tree.description,
          faculty: treeRes.tree.faculty,
          department: treeRes.tree.department,
        });
      }

      setNodes(nodesRes.nodes.map(protoToTreeNode));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ไม่พบลิงก์แชร์นี้";
      setError(message);
      console.error("Failed to fetch shared tree:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsPanelOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        setDirection((prev) => (prev === "TB" ? "LR" : "TB"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const handleToggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  }, []);

  const handleSearchSelect = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  if (loading) return <LoadingState />;

  if (error || !tree) {
    return <ErrorState message={error || "ไม่พบลิงก์แชร์นี้"} />;
  }

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar (read-only) */}
      <ShareToolbar
        treeName={tree.name}
        nodeCount={nodes.length}
        direction={direction}
        onSearch={() => setIsSearchOpen(true)}
        onToggleDirection={handleToggleDirection}
        onRefresh={fetchData}
      />

      {/* Canvas (read-only) */}
      <div className="relative flex-1">
        <TreeEditorInner
          treeNodes={nodes}
          direction={direction}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          allNodes={nodes}
          isPanelOpen={isPanelOpen}
          onClosePanel={handleClosePanel}
          onNodeSelect={setSelectedNode}
        />

        {/* Read-only hint */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 border-orange-200 bg-orange-50 text-orange-700 text-xs"
          >
            <Eye className="h-3 w-3" />
            ดูอย่างเดียว (Share Link)
          </Badge>
        </div>
      </div>

      {/* Search */}
      <TreeSearch
        nodes={nodes}
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
    </div>
  );
}

// ==================== Share Toolbar ====================

interface ShareToolbarProps {
  treeName: string;
  nodeCount: number;
  direction: LayoutDirection;
  onSearch: () => void;
  onToggleDirection: () => void;
  onRefresh: () => void;
}

function ShareToolbar({
  treeName,
  nodeCount,
  direction,
  onSearch,
  onToggleDirection,
  onRefresh,
}: ShareToolbarProps) {
  const { fitView } = useReactFlow();

  const handleFitView = () => {
    fitView({ padding: 0.3, maxZoom: 1.2, duration: 500 });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className="grid h-12 grid-cols-3 items-center border-b bg-background/80 px-3 backdrop-blur-md"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Left */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>กลับหน้าหลัก</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-blue-600" />
            <h1 className="truncate text-sm font-semibold">{treeName}</h1>
            <Badge
              variant="secondary"
              className="shrink-0 gap-1 text-[10px] font-medium"
            >
              <Users className="h-2.5 w-2.5" />
              {nodeCount}
            </Badge>
          </div>
        </div>

        {/* Center */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={onSearch}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ค้นหา (Ctrl+K)</TooltipContent>
            </Tooltip>

            <div className="mx-0.5 h-4 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={onRefresh}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>จัดเรียงใหม่</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={onToggleDirection}
                >
                  {direction === "TB" ? (
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownUp className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {direction === "TB"
                  ? "เปลี่ยนเป็นแนวนอน"
                  : "เปลี่ยนเป็นแนวตั้ง"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={handleFitView}
                >
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>พอดีจอ</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right */}
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className="gap-1 border-orange-200 bg-orange-50 text-orange-700"
          >
            <Eye className="h-3 w-3" />
            ดูอย่างเดียว
          </Badge>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

// ==================== States ====================

function LoadingState() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex h-12 items-center justify-between border-b bg-background/80 px-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-foreground">
              กำลังโหลดสายรหัส...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">รอสักครู่</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex h-12 items-center border-b bg-background/80 px-3 backdrop-blur-md">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              ไม่พบลิงก์แชร์
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                กลับหน้าหลัก
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              ลองใหม่
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
