"use client";

import { useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import TreeCanvas from "@/components/tree/tree-canvas";
import TreeToolbar from "@/components/tree/tree-toolbar";
import NodeDetailPanel from "@/components/node/node-detail-panel";
import { type TreeNodeData } from "@/lib/tree/layout-engine";
import { MOCK_NODES } from "@/lib/tree/mock-data";

interface TreeEditorPageProps {
  params: Promise<{ treeId: string }>;
}

export default function TreeEditorPage({ params }: TreeEditorPageProps) {
  // ใช้ Mock Data ก่อน — Day 7 จะเปลี่ยนเป็น real data
  const [treeNodes] = useState<TreeNodeData[]>(MOCK_NODES);

  // Selected node สำหรับ detail panel
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Handle node click → เปิด detail panel
  const handleNodeClick = useCallback((node: TreeNodeData) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  // Handle close panel
  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Handle add node (placeholder — Day 7)
  const handleAddNode = useCallback(() => {
    console.log("TODO: Open add node dialog");
  }, []);

  // Handle edit node (placeholder — Day 10)
  const handleEditNode = useCallback((node: TreeNodeData) => {
    console.log("TODO: Open edit dialog for", node.nickname);
  }, []);

  // Handle delete node (placeholder — Day 10)
  const handleDeleteNode = useCallback((node: TreeNodeData) => {
    console.log("TODO: Delete", node.nickname);
  }, []);

  // Handle add child (placeholder — Day 10)
  const handleAddChild = useCallback((parentNode: TreeNodeData) => {
    console.log("TODO: Add child to", parentNode.nickname);
  }, []);

  // Handle auto layout (placeholder)
  const handleAutoLayout = useCallback(() => {
    console.log("TODO: Auto layout");
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <TreeToolbar
        treeName="สายรหัส CE 67"
        nodeCount={treeNodes.length}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
      />

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlowProvider>
          <TreeCanvas
            treeNodes={treeNodes}
            onNodeClick={handleNodeClick}
          />
        </ReactFlowProvider>
      </div>

      {/* Detail Panel */}
      <NodeDetailPanel
        node={selectedNode}
        allNodes={treeNodes}
        open={isPanelOpen}
        onClose={handleClosePanel}
        onEdit={handleEditNode}
        onDelete={handleDeleteNode}
        onAddChild={handleAddChild}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}