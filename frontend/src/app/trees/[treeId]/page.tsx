"use client";

import { useState, useCallback, useEffect, use } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import TreeToolbar from "@/components/tree/tree-toolbar";
import NodeFormDialog from "@/components/node/node-form-dialog";
import ConnectConfirmDialog from "@/components/tree/connect-confirm-dialog";
import DeleteNodeDialog from "@/components/node/delete-confirm-dialog";
import UnlinkNodeDialog from "@/components/node/unlink-node-dialog";
import TreeSearch from "@/components/tree/tree-search";
import TreeEditorInner from "@/components/tree/tree-editor-inner";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import { validateMove } from "@/lib/tree/validator";
import { useTree } from "@/hooks/use-trees";
import {
  useTreeNodes,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useMoveNode,
  useUnlinkNode,
} from "@/hooks/use-nodes";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  // Data hooks
  const { tree, loading: treeLoading } = useTree(treeId);
  const { nodes: treeNodes, loading: nodesLoading, refetch: refetchNodes } = useTreeNodes(treeId);
  const { createNode, loading: creating } = useCreateNode();
  const { updateNode, loading: updating } = useUpdateNode();
  const { deleteNode, loading: deleting } = useDeleteNode();
  const { moveNode, loading: moving } = useMoveNode();
  const { unlinkNode, loading: unlinking } = useUnlinkNode();

  // ==================== UI State ====================
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Edit dialog
  const [editNode, setEditNode] = useState<TreeNodeData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<TreeNodeData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Unlink dialog
  const [unlinkTarget, setUnlinkTarget] = useState<TreeNodeData | null>(null);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);

  // Move dialog
  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    sourceNode: TreeNodeData | null;
    targetNode: TreeNodeData | null;
  }>({ open: false, sourceNode: null, targetNode: null });

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ==================== Keyboard Shortcuts ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F → Search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Escape → Close search/panels
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsPanelOpen(false);
      }

      // Delete → Delete selected node
      if (e.key === "Delete" && selectedNode && !isAddDialogOpen && !isEditDialogOpen) {
        setDeleteTarget(selectedNode);
        setIsDeleteDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, isAddDialogOpen, isEditDialogOpen]);

  // ==================== Node Click ====================
  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // ==================== Add Node ====================
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
    async (data: { nickname: string; firstName: string; lastName: string; studentId: string; parentId: string | null; status: string }) => {
      const result = await createNode({ treeId, ...data });
      if (result) {
        setIsAddDialogOpen(false);
        refetchNodes();
      }
    },
    [treeId, createNode, refetchNodes]
  );

  // ==================== Edit Node ====================
  const handleEditNode = useCallback((node: TreeNodeData) => {
    setEditNode(node);
    setIsEditDialogOpen(true);
    setIsPanelOpen(false);
  }, []);

  const handleUpdateNode = useCallback(
    async (data: { nickname: string; firstName: string; lastName: string; studentId: string; parentId: string | null; status: string }) => {
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

  // ==================== Delete Node ====================
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

  // ==================== Unlink Node ====================
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

  // ==================== Move Node ====================
  const initiateMoveNode = useCallback(
    (newParentId: string, nodeToMoveId: string) => {
      const sourceNode = treeNodes.find((n) => n.id === newParentId);
      const targetNode = treeNodes.find((n) => n.id === nodeToMoveId);
      if (!sourceNode || !targetNode) return;

      const validation = validateMove(treeNodes, nodeToMoveId, newParentId);
      if (!validation.valid) {
        toast.error(validation.error || "ไม่สามารถย้ายได้");
        return;
      }

      setMoveDialog({ open: true, sourceNode, targetNode });
    },
    [treeNodes]
  );

  const handleConnect = useCallback(
    (sourceId: string, targetId: string) => initiateMoveNode(sourceId, targetId),
    [initiateMoveNode]
  );

  const handleNodeDrop = useCallback(
    (draggedNodeId: string, targetNodeId: string) => initiateMoveNode(targetNodeId, draggedNodeId),
    [initiateMoveNode]
  );

  const handleConfirmMove = useCallback(async () => {
    const { sourceNode, targetNode } = moveDialog;
    if (!sourceNode || !targetNode) return;

    const success = await moveNode(targetNode.id, sourceNode.id);
    if (success) {
      setMoveDialog({ open: false, sourceNode: null, targetNode: null });
      refetchNodes();
    }
  }, [moveDialog, moveNode, refetchNodes]);

  // ==================== Search ====================
  const handleSearchSelect = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  // ==================== Loading ====================
  if (treeLoading || nodesLoading) {
    return <LoadingState />;
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      <TreeToolbar
        treeName={tree?.name || "สายรหัส"}
        nodeCount={treeNodes.length}
        onAddNode={handleAddNode}
        onAutoLayout={() => refetchNodes()}
        onSearch={() => setIsSearchOpen(true)}
      />

      <div className="flex-1">
        <TreeEditorInner
          treeNodes={treeNodes}
          onNodeClick={handleNodeClick}
          onConnect={handleConnect}
          onNodeDrop={handleNodeDrop}
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
        onClose={() => { setIsEditDialogOpen(false); setEditNode(null); }}
        onSubmit={handleUpdateNode}
        allNodes={treeNodes}
        loading={updating}
        editNode={editNode}
      />

      {/* Delete Dialog */}
      <DeleteNodeDialog
        open={isDeleteDialogOpen}
        onClose={() => { setIsDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleConfirmDelete}
        node={deleteTarget}
        allNodes={treeNodes}
        loading={deleting}
      />

      {/* Unlink Dialog */}
      <UnlinkNodeDialog
        open={isUnlinkDialogOpen}
        onClose={() => { setIsUnlinkDialogOpen(false); setUnlinkTarget(null); }}
        onConfirm={handleConfirmUnlink}
        node={unlinkTarget}
        allNodes={treeNodes}
        loading={unlinking}
      />

      {/* Move Dialog */}
      <ConnectConfirmDialog
        open={moveDialog.open}
        onClose={() => setMoveDialog({ open: false, sourceNode: null, targetNode: null })}
        onConfirm={handleConfirmMove}
        sourceNode={moveDialog.sourceNode}
        targetNode={moveDialog.targetNode}
        allNodes={treeNodes}
        loading={moving}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          <p className="mt-4 text-sm text-muted-foreground">กำลังโหลดสายรหัส...</p>
        </div>
      </div>
    </div>
  );
}