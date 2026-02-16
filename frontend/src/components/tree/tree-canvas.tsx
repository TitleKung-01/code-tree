"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  type Node,
  type NodeMouseHandler,
  type OnConnect,
  type Connection,
  type OnNodeDrag,
  ConnectionLineType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TreeNodeComponent from "./tree-node";  
import {
  TreeNodeData,
  buildFlowElements,
  getGenerationColor,
} from "@/lib/tree/layout-engine";

const nodeTypes = {
  treeNode: TreeNodeComponent,
};

interface TreeCanvasProps {
  treeNodes: TreeNodeData[];
  onNodeClick?: (node: TreeNodeData) => void;
  onConnect?: (sourceId: string, targetId: string) => void;
  onNodeDrop?: (draggedNodeId: string, targetNodeId: string) => void;
  onAddChild?: (node: TreeNodeData) => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onUnlink?: (node: TreeNodeData) => void;
}

export default function TreeCanvas({
  treeNodes,
  onNodeClick,
  onConnect: onConnectProp,
  onNodeDrop,
  onAddChild,
  onEdit,
  onDelete,
  onUnlink,
}: TreeCanvasProps) {
  const { fitView, getIntersectingNodes } = useReactFlow();
  const prevNodeCountRef = useRef(treeNodes.length);

  const { flowNodes: layoutNodes, flowEdges: layoutEdges } = useMemo(
    () => buildFlowElements(treeNodes),
    [treeNodes]
  );

  // ★ Inject callbacks เข้าไปใน node data สำหรับ context menu
  const nodesWithCallbacks = useMemo(
    () =>
      layoutNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onAddChild,
          onEdit,
          onDelete,
          onUnlink,
          onFocus: onNodeClick,
        },
      })),
    [layoutNodes, onAddChild, onEdit, onDelete, onUnlink, onNodeClick]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithCallbacks);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  useEffect(() => {
    setNodes(nodesWithCallbacks);
    setEdges(layoutEdges);

    const nodeCountChanged = treeNodes.length !== prevNodeCountRef.current;
    prevNodeCountRef.current = treeNodes.length;

    if (nodeCountChanged && treeNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.3, maxZoom: 1.2, duration: 500 });
      }, 100);
    }
  }, [nodesWithCallbacks, layoutEdges, setNodes, setEdges, fitView, treeNodes.length]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeClick?.(node.data as TreeNodeData);
    },
    [onNodeClick]
  );

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && onConnectProp) {
        onConnectProp(connection.source, connection.target);
      }
    },
    [onConnectProp]
  );

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, draggedNode) => {
      if (!onNodeDrop) return;

      const intersecting = getIntersectingNodes(draggedNode);
      if (intersecting.length > 0) {
        const targetNode = intersecting.find((n) => n.id !== draggedNode.id);
        if (targetNode) {
          onNodeDrop(draggedNode.id, targetNode.id);
        }
      }

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === draggedNode.id) {
            const original = nodesWithCallbacks.find((ln) => ln.id === n.id);
            if (original) {
              return { ...n, position: original.position };
            }
          }
          return n;
        })
      );
    },
    [onNodeDrop, getIntersectingNodes, setNodes, nodesWithCallbacks]
  );

  const miniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as TreeNodeData;
    return getGenerationColor(data?.generation || 1);
  }, []);

  const generations = useMemo(() => {
    return [...new Set(treeNodes.map((n) => n.generation))].sort();
  }, [treeNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={true}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap position="bottom-right" nodeColor={miniMapNodeColor} maskColor="rgba(0,0,0,0.1)" pannable zoomable />

        {treeNodes.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-lg font-medium text-gray-500">🌳 ยังไม่มีคนในสายรหัส</p>
              <p className="mt-1 text-sm text-gray-400">กดปุ่ม &quot;+ เพิ่มคน&quot; เพื่อเริ่มสร้างสายรหัส</p>
            </div>
          </Panel>
        )}

        {generations.length > 0 && (
          <Panel position="top-right">
            <div className="rounded-lg border bg-white/90 p-3 shadow-sm backdrop-blur">
              <p className="mb-2 text-xs font-medium text-gray-500">สัญลักษณ์รุ่น</p>
              <div className="space-y-1">
                {generations.map((gen) => (
                  <div key={gen} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: getGenerationColor(gen) }} />
                    <span className="text-xs text-gray-600">รุ่นที่ {gen}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}