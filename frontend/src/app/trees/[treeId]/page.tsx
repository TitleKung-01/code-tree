"use client";

import { useState, useCallback, useEffect, use } from "react";
import type { LayoutDirection } from "@/lib/tree/layout-engine";
import { ReactFlowProvider } from "@xyflow/react";
import TreeToolbar, { type ViewMode } from "@/components/tree/tree-toolbar";
import TreeTableView, { type CsvImportRow } from "@/components/tree/tree-table-view";
import NodeFormDialog from "@/components/node/node-form-dialog";
import ConnectConfirmDialog from "@/components/tree/connect-confirm-dialog";
import DeleteNodeDialog from "@/components/node/delete-confirm-dialog";
import UnlinkNodeDialog from "@/components/node/unlink-node-dialog";
import TreeSearch from "@/components/tree/tree-search";
import TreeEditorInner from "@/components/tree/tree-editor-inner";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import { validateAddParent } from "@/lib/tree/validator";
import { useTree } from "@/hooks/use-trees";
import {
  useTreeNodes,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useUnlinkNode,
  useAddParent,
  useRemoveParent,
} from "@/hooks/use-nodes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TreePine,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface TreeEditorPageProps {
  params: Promise<{ treeId: string }>;
}

export default function TreeEditorPage({ params }: TreeEditorPageProps) {
  const { treeId } = use(params);

  return (
    <ReactFlowProvider>
      <TreeEditorContent treeId={treeId} />
    </ReactFlowProvider>
  );
}

function TreeEditorContent({ treeId }: { treeId: string }) {
  const { tree, loading: treeLoading, error: treeError } = useTree(treeId);
  const {
    nodes: treeNodes,
    loading: nodesLoading,
    refetch: refetchNodes,
  } = useTreeNodes(treeId);
  const { createNode, loading: creating } = useCreateNode();
  const { updateNode, loading: updating } = useUpdateNode();
  const { deleteNode, loading: deleting } = useDeleteNode();
  const { unlinkNode, loading: unlinking } = useUnlinkNode();
  const { addParent, loading: adding } = useAddParent();
  const { removeParent } = useRemoveParent();

  /* ─── UI State ─── */
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const [editNode, setEditNode] = useState<TreeNodeData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TreeNodeData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [unlinkTarget, setUnlinkTarget] = useState<TreeNodeData | null>(null);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);

  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    sourceNode: TreeNodeData | null;
    targetNode: TreeNodeData | null;
  }>({ open: false, sourceNode: null, targetNode: null });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [direction, setDirection] = useState<LayoutDirection>("TB");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  /* ─── Keyboard Shortcuts ─── */
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
      if (
        e.key === "Delete" &&
        selectedNode &&
        !isAddDialogOpen &&
        !isEditDialogOpen
      ) {
        setDeleteTarget(selectedNode);
        setIsDeleteDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, isAddDialogOpen, isEditDialogOpen]);

  /* ─── Node Click ─── */
  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  /* ─── Add Node ─── */
  const handleAddNode = useCallback(() => {
    setDefaultParentId(null);
    setIsAddDialogOpen(true);
  }, []);

  const handleAddChild = useCallback((parentNode: TreeNodeData) => {
    setDefaultParentId(parentNode.id);
    setIsAddDialogOpen(true);
    setIsPanelOpen(false);
  }, []);

  const handleCreateNode = useCallback(
    async (data: {
      nickname: string;
      firstName: string;
      lastName: string;
      studentId: string;
      parentId: string | null;
      status: string;
    }) => {
      const result = await createNode({ treeId, ...data });
      if (result) {
        setIsAddDialogOpen(false);
        refetchNodes();
      }
    },
    [treeId, createNode, refetchNodes]
  );

  /* ─── Edit Node ─── */
  const handleEditNode = useCallback((node: TreeNodeData) => {
    setEditNode(node);
    setIsEditDialogOpen(true);
    setIsPanelOpen(false);
  }, []);

  const handleUpdateNode = useCallback(
    async (data: {
      nickname: string;
      firstName: string;
      lastName: string;
      studentId: string;
      parentId: string | null;
      status: string;
    }) => {
      if (!editNode) return;

      const success = await updateNode({
        id: editNode.id,
        nickname: data.nickname,
        firstName: data.firstName,
        lastName: data.lastName,
        studentId: data.studentId,
        status: data.status,
      });

      if (success) {
        setIsEditDialogOpen(false);
        setEditNode(null);
        refetchNodes();
      }
    },
    [editNode, updateNode, refetchNodes]
  );

  /* ─── Delete Node ─── */
  const handleDeleteNode = useCallback((node: TreeNodeData) => {
    setDeleteTarget(node);
    setIsDeleteDialogOpen(true);
    setIsPanelOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const success = await deleteNode(deleteTarget.id, deleteTarget.nickname);
    if (success) {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      setSelectedNode(null);
      refetchNodes();
    }
  }, [deleteTarget, deleteNode, refetchNodes]);

  /* ─── Unlink Node ─── */
  const handleUnlinkNode = useCallback((node: TreeNodeData) => {
    setUnlinkTarget(node);
    setIsUnlinkDialogOpen(true);
  }, []);

  const handleConfirmUnlink = useCallback(async () => {
    if (!unlinkTarget) return;

    const success = await unlinkNode(unlinkTarget.id, unlinkTarget.nickname);
    if (success) {
      setIsUnlinkDialogOpen(false);
      setUnlinkTarget(null);
      refetchNodes();
    }
  }, [unlinkTarget, unlinkNode, refetchNodes]);

  /* ─── Add Parent (Connect) ─── */
  const initiateAddParent = useCallback(
    (newParentId: string, childNodeId: string) => {
      const sourceNode = treeNodes.find((n) => n.id === newParentId);
      const targetNode = treeNodes.find((n) => n.id === childNodeId);
      if (!sourceNode || !targetNode) return;

      const validation = validateAddParent(
        treeNodes,
        childNodeId,
        newParentId
      );
      if (!validation.valid) {
        toast.error(validation.error || "ไม่สามารถเพิ่มสายได้");
        return;
      }

      setMoveDialog({ open: true, sourceNode, targetNode });
    },
    [treeNodes]
  );

  const handleConnect = useCallback(
    (sourceId: string, targetId: string) =>
      initiateAddParent(sourceId, targetId),
    [initiateAddParent]
  );

  const handleNodeDrop = useCallback(
    (draggedNodeId: string, targetNodeId: string) =>
      initiateAddParent(targetNodeId, draggedNodeId),
    [initiateAddParent]
  );

  const handleConfirmMove = useCallback(async () => {
    const { sourceNode, targetNode } = moveDialog;
    if (!sourceNode || !targetNode) return;

    const success = await addParent(targetNode.id, sourceNode.id);
    if (success) {
      setMoveDialog({ open: false, sourceNode: null, targetNode: null });
      refetchNodes();
    }
  }, [moveDialog, addParent, refetchNodes]);

  /* ─── Layout Direction ─── */
  const handleToggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  }, []);

  /* ─── Edge Click (Remove specific parent) ─── */
  const handleEdgeClick = useCallback(
    async (sourceId: string, targetId: string) => {
      const targetNode = treeNodes.find((n) => n.id === targetId);
      if (!targetNode || targetNode.parentIds.length === 0) return;

      if (targetNode.parentIds.length === 1) {
        setUnlinkTarget(targetNode);
        setIsUnlinkDialogOpen(true);
        return;
      }

      const success = await removeParent(
        targetId,
        sourceId,
        targetNode.nickname
      );
      if (success) {
        refetchNodes();
      }
    },
    [treeNodes, removeParent, refetchNodes]
  );

  /* ─── Search ─── */
  const handleSearchSelect = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  /* ─── CSV Import ─── */
  const [csvImporting, setCsvImporting] = useState(false);

  const handleImportCsv = useCallback(
    async (rows: CsvImportRow[]) => {
      setCsvImporting(true);
      try {
        const nicknameToId = new Map<string, string>();
        treeNodes.forEach((n) => nicknameToId.set(n.nickname, n.id));

        const withoutParent: CsvImportRow[] = [];
        const withParent: CsvImportRow[] = [];
        rows.forEach((r) => {
          if (r.parentNickname) {
            withParent.push(r);
          } else {
            withoutParent.push(r);
          }
        });

        let created = 0;
        let failed = 0;

        for (const row of withoutParent) {
          const result = await createNode({
            treeId,
            nickname: row.nickname,
            firstName: row.firstName,
            lastName: row.lastName,
            studentId: row.studentId,
            status: row.status,
            parentId: null,
          });
          if (result) {
            nicknameToId.set(row.nickname, result.id);
            created++;
          } else {
            failed++;
          }
        }

        for (const row of withParent) {
          const parentNames = row.parentNickname
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
          const parentId = parentNames.length > 0
            ? nicknameToId.get(parentNames[0]) || null
            : null;

          const result = await createNode({
            treeId,
            nickname: row.nickname,
            firstName: row.firstName,
            lastName: row.lastName,
            studentId: row.studentId,
            status: row.status,
            parentId,
          });
          if (result) {
            nicknameToId.set(row.nickname, result.id);
            created++;
          } else {
            failed++;
          }
        }

        if (created > 0) {
          toast.success(`นำเข้าสำเร็จ ${created} รายการ`);
          refetchNodes();
        }
        if (failed > 0) {
          toast.error(`นำเข้าไม่สำเร็จ ${failed} รายการ`);
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการนำเข้า");
      } finally {
        setCsvImporting(false);
      }
    },
    [treeId, treeNodes, createNode, refetchNodes]
  );

  /* ─── Loading ─── */
  if (treeLoading || nodesLoading) {
    return <LoadingState />;
  }

  /* ─── Error ─── */
  if (treeError || !tree) {
    return <ErrorState message={treeError || "ไม่พบสายรหัสนี้"} />;
  }

  /* ─── Main Layout ─── */
  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col">
      <TreeToolbar
        treeName={tree.name}
        nodeCount={treeNodes.length}
        direction={direction}
        viewMode={viewMode}
        onAddNode={handleAddNode}
        onAutoLayout={() => refetchNodes()}
        onSearch={() => setIsSearchOpen(true)}
        onToggleDirection={handleToggleDirection}
        onViewModeChange={setViewMode}
      />

      <div className="relative flex-1">
        {viewMode === "graph" ? (
          <>
            <TreeEditorInner
              treeNodes={treeNodes}
              direction={direction}
              onNodeClick={handleNodeClick}
              onConnect={handleConnect}
              onNodeDrop={handleNodeDrop}
              onEdgeClick={handleEdgeClick}
              onAddChild={handleAddChild}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onUnlink={handleUnlinkNode}
              selectedNode={selectedNode}
              allNodes={treeNodes}
              isPanelOpen={isPanelOpen}
              onClosePanel={handleClosePanel}
              onNodeSelect={setSelectedNode}
            />

            {/* Keyboard shortcut hints */}
            <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden items-center gap-3 text-[11px] text-muted-foreground/60 lg:flex">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] shadow-sm backdrop-blur-sm">
                  Ctrl+K
                </kbd>
                ค้นหา
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] shadow-sm backdrop-blur-sm">
                  Ctrl+L
                </kbd>
                สลับทิศ
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] shadow-sm backdrop-blur-sm">
                  Del
                </kbd>
                ลบ
              </span>
            </div>
          </>
        ) : (
          <TreeTableView
            nodes={treeNodes}
            allNodes={treeNodes}
            onNodeClick={handleNodeClick}
            onEdit={handleEditNode}
            onDelete={handleDeleteNode}
            onAddChild={handleAddChild}
            onImportCsv={handleImportCsv}
            importing={csvImporting}
          />
        )}
      </div>

      {/* Search Overlay */}
      <TreeSearch
        nodes={treeNodes}
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSearchSelect}
      />

      {/* Add Node Dialog */}
      <NodeFormDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateNode}
        allNodes={treeNodes}
        defaultParentId={defaultParentId}
        loading={creating}
      />

      {/* Edit Node Dialog */}
      <NodeFormDialog
        open={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditNode(null);
        }}
        onSubmit={handleUpdateNode}
        allNodes={treeNodes}
        loading={updating}
        editNode={editNode}
      />

      {/* Delete Dialog */}
      <DeleteNodeDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        node={deleteTarget}
        allNodes={treeNodes}
        loading={deleting}
      />

      {/* Unlink Dialog */}
      <UnlinkNodeDialog
        open={isUnlinkDialogOpen}
        onClose={() => {
          setIsUnlinkDialogOpen(false);
          setUnlinkTarget(null);
        }}
        onConfirm={handleConfirmUnlink}
        node={unlinkTarget}
        allNodes={treeNodes}
        loading={unlinking}
      />

      {/* Add Parent Dialog */}
      <ConnectConfirmDialog
        open={moveDialog.open}
        onClose={() =>
          setMoveDialog({ open: false, sourceNode: null, targetNode: null })
        }
        onConfirm={handleConfirmMove}
        sourceNode={moveDialog.sourceNode}
        targetNode={moveDialog.targetNode}
        allNodes={treeNodes}
        loading={adding}
      />
    </div>
  );
}

/* ─── States ─── */

function LoadingState() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar skeleton */}
      <div className="flex h-12 items-center justify-between border-b bg-background/80 px-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            {/* <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-green-500/10 to-emerald-500/5">
              <TreePine className="h-8 w-8 text-green-500/50" />
            </div> */}
            <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              กำลังโหลดสายรหัส...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              รอสักครู่
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Minimal toolbar */}
      <div className="flex h-12 items-center border-b bg-background/80 px-3 backdrop-blur-md">
        <Link href="/trees">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Error content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              เกิดข้อผิดพลาด
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/trees">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                กลับหน้ารายการ
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
