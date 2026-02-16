"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import TreeCanvas from "./tree-canvas";
import NodeDetailPanel from "@/components/node/node-detail-panel";
import { TreeNodeData } from "@/lib/tree/layout-engine";

interface TreeEditorInnerProps {
  treeNodes: TreeNodeData[];
  onNodeClick: (node: TreeNodeData) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onNodeDrop: (draggedNodeId: string, targetNodeId: string) => void;
  selectedNode: TreeNodeData | null;
  allNodes: TreeNodeData[];
  isPanelOpen: boolean;
  onClosePanel: () => void;
  onEdit: (node: TreeNodeData) => void;
  onDelete: (node: TreeNodeData) => void;
  onUnlink: (node: TreeNodeData) => void;
  onAddChild: (node: TreeNodeData) => void;
  onNodeSelect: (node: TreeNodeData) => void;
  onContextAction?: (action: string, node: TreeNodeData) => void;
}

export default function TreeEditorInner({
  treeNodes,
  onNodeClick,
  onConnect,
  onNodeDrop,
  selectedNode,
  allNodes,
  isPanelOpen,
  onClosePanel,
  onEdit,
  onDelete,
  onUnlink,
  onAddChild,
  onNodeSelect,
}: TreeEditorInnerProps) {
  const { setCenter, getNode } = useReactFlow();

  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;

      const x = node.position.x + (node.measured?.width ?? 200) / 2;
      const y = node.position.y + (node.measured?.height ?? 100) / 2;

      setCenter(x, y, { zoom: 1, duration: 600 });
    },
    [setCenter, getNode]
  );

  return (
    <>
      <TreeCanvas
        treeNodes={treeNodes}
        onNodeClick={onNodeClick}
        onConnect={onConnect}
        onNodeDrop={onNodeDrop}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
        onUnlink={onUnlink}
      />

      <NodeDetailPanel
        node={selectedNode}
        allNodes={allNodes}
        open={isPanelOpen}
        onClose={onClosePanel}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
        onNodeSelect={(node) => {
          onNodeSelect(node);
          handleNavigateToNode(node.id);
        }}
        onNavigateToNode={handleNavigateToNode}
      />
    </>
  );
}