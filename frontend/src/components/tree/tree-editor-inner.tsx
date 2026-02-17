"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import TreeCanvas from "./tree-canvas";
import NodeDetailPanel from "@/components/node/node-detail-panel";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import type { LayoutDirection } from "@/lib/tree/layout-engine";

interface TreeEditorInnerProps {
  treeNodes: TreeNodeData[];
  direction: LayoutDirection;
  onNodeClick: (node: TreeNodeData) => void;
  onConnect?: (sourceId: string, targetId: string) => void;
  onNodeDrop?: (draggedNodeId: string, targetNodeId: string) => void;
  onEdgeClick?: (sourceId: string, targetId: string) => void;
  onAddChild?: (node: TreeNodeData) => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onUnlink?: (node: TreeNodeData) => void;
  selectedNode: TreeNodeData | null;
  allNodes: TreeNodeData[];
  isPanelOpen: boolean;
  onClosePanel: () => void;
  onNodeSelect: (node: TreeNodeData) => void;
}

export default function TreeEditorInner(props: TreeEditorInnerProps) {
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
        treeNodes={props.treeNodes}
        direction={props.direction}
        onNodeClick={props.onNodeClick}
        onConnect={props.onConnect}
        onNodeDrop={props.onNodeDrop}
        onEdgeClick={props.onEdgeClick}
        onAddChild={props.onAddChild}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onUnlink={props.onUnlink}
      />

      <NodeDetailPanel
        node={props.selectedNode}
        allNodes={props.allNodes}
        open={props.isPanelOpen}
        onClose={props.onClosePanel}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onAddChild={props.onAddChild}
        onNodeSelect={(node) => {
          props.onNodeSelect(node);
          handleNavigateToNode(node.id);
        }}
        onNavigateToNode={handleNavigateToNode}
      />
    </>
  );
}