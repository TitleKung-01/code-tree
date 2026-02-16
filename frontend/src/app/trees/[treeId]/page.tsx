"use client";

import { useState, useCallback, use } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import TreeToolbar from "@/components/tree/tree-toolbar";
import NodeFormDialog from "@/components/node/node-form-dialog";
import ConnectConfirmDialog from "@/components/tree/connect-confirm-dialog";
import TreeEditorInner from "@/components/tree/tree-editor-inner";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import { validateMove } from "@/lib/tree/validator";
import { useTree } from "@/hooks/use-trees";
import { useTreeNodes, useCreateNode, useMoveNode } from "@/hooks/use-nodes";
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
  const { tree, loading: treeLoading } = useTree(treeId);
  const {
    nodes: treeNodes,
    loading: nodesLoading,
    refetch: refetchNodes,
  } = useTreeNodes(treeId);
  const { createNode, loading: creating } = useCreateNode();
  const { moveNode, loading: moving } = useMoveNode();

  // UI state
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Move dialog state
  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    sourceNode: TreeNodeData | null; // จะเป็น parent ใหม่
    targetNode: TreeNodeData | null; // node ที่จะถูกย้าย
  }>({ open: false, sourceNode: null, targetNode: null });

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
    async (data: {
      nickname: string;
      firstName: string;
      lastName: string;
      studentId: string;
      parentId: string | null;
      status: string;
    }) => {
      const result = await createNode({
        treeId,
        parentId: data.parentId,
        nickname: data.nickname,
        firstName: data.firstName,
        lastName: data.lastName,
        studentId: data.studentId,
        status: data.status,
      });

      if (result) {
        setIsAddDialogOpen(false);
        refetchNodes();
      }
    },
    [treeId, createNode, refetchNodes]
  );

  // ==================== Move Node (shared logic) ====================
  const initiateMoveNode = useCallback(
    (newParentId: string, nodeToMoveId: string) => {
      const sourceNode = treeNodes.find((n) => n.id === newParentId);
      const targetNode = treeNodes.find((n) => n.id === nodeToMoveId);

      if (!sourceNode || !targetNode) return;

      // Frontend validation
      const validation = validateMove(treeNodes, nodeToMoveId, newParentId);

      if (!validation.valid) {
        toast.error(validation.error || "ไม่สามารถย้ายได้");
        return;
      }

      // เปิด confirm dialog
      setMoveDialog({
        open: true,
        sourceNode,  // parent ใหม่
        targetNode,  // node ที่จะย้าย
      });
    },
    [treeNodes]
  );

  // Handle connect (ลากเส้น handle → handle)
  // source = พี่ (parent ใหม่), target = น้อง (node ที่จะย้าย)
  const handleConnect = useCallback(
    (sourceId: string, targetId: string) => {
      initiateMoveNode(sourceId, targetId);
    },
    [initiateMoveNode]
  );

  // ★ Handle node drop (ลาก node ไปวางบน node อื่น)
  // draggedNode = node ที่จะย้าย, targetNode = parent ใหม่
  const handleNodeDrop = useCallback(
    (draggedNodeId: string, targetNodeId: string) => {
      initiateMoveNode(targetNodeId, draggedNodeId);
    },
    [initiateMoveNode]
  );

  // Confirm move
  const handleConfirmMove = useCallback(async () => {
    const { sourceNode, targetNode } = moveDialog;
    if (!sourceNode || !targetNode) return;

    // sourceNode = parent ใหม่, targetNode = node ที่ย้าย
    const success = await moveNode(targetNode.id, sourceNode.id);

    if (success) {
      setMoveDialog({ open: false, sourceNode: null, targetNode: null });
      refetchNodes();
    }
  }, [moveDialog, moveNode, refetchNodes]);

  // ==================== Edit / Delete (placeholder → Day 10) ====================
  const handleEditNode = useCallback((node: TreeNodeData) => {
    console.log("TODO Day 10: edit", node.nickname);
  }, []);

  const handleDeleteNode = useCallback((node: TreeNodeData) => {
    console.log("TODO Day 10: delete", node.nickname);
  }, []);

  // ==================== Auto Layout ====================
  const handleAutoLayout = useCallback(() => {
    refetchNodes();
  }, [refetchNodes]);

  // ==================== Loading ====================
  if (treeLoading || nodesLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <TreeToolbar
        treeName={tree?.name || "สายรหัส"}
        nodeCount={treeNodes.length}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
      />

      <div className="flex-1">
        <TreeEditorInner
          treeNodes={treeNodes}
          onNodeClick={handleNodeClick}
          onConnect={handleConnect}
          onNodeDrop={handleNodeDrop}
          selectedNode={selectedNode}
          allNodes={treeNodes}
          isPanelOpen={isPanelOpen}
          onClosePanel={handleClosePanel}
          onEdit={handleEditNode}
          onDelete={handleDeleteNode}
          onAddChild={handleAddChild}
          onNodeSelect={setSelectedNode}
        />
      </div>

      <NodeFormDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateNode}
        allNodes={treeNodes}
        defaultParentId={defaultParentId}
        loading={creating}
      />

      <ConnectConfirmDialog
        open={moveDialog.open}
        onClose={() =>
          setMoveDialog({ open: false, sourceNode: null, targetNode: null })
        }
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
          <p className="mt-4 text-sm text-muted-foreground">
            กำลังโหลดสายรหัส...
          </p>
        </div>
      </div>
    </div>
  );
}