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
  type Edge,
  type NodeMouseHandler,
  type OnConnect,
  type Connection,
  type OnNodeDrag,
  ConnectionLineType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TreePine } from "lucide-react";
import TreeNodeComponent from "./tree-node";
import TreeEdgeComponent from "./tree-edge";
import {
  TreeNodeData,
  buildFlowElements,
  getGenerationColor,
  type LayoutDirection,
} from "@/lib/tree/layout-engine";

const nodeTypes = { treeNode: TreeNodeComponent };
const edgeTypes = { customEdge: TreeEdgeComponent };

interface TreeCanvasProps {
  treeNodes: TreeNodeData[];
  direction?: LayoutDirection;
  onNodeClick?: (node: TreeNodeData) => void;
  onConnect?: (sourceId: string, targetId: string) => void;
  onNodeDrop?: (draggedNodeId: string, targetNodeId: string) => void;
  onEdgeClick?: (sourceId: string, targetId: string) => void;
  onAddChild?: (node: TreeNodeData) => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onUnlink?: (node: TreeNodeData) => void;
}

export default function TreeCanvas({
  treeNodes,
  direction = "TB",
  onNodeClick,
  onConnect: onConnectProp,
  onNodeDrop,
  onEdgeClick,
  onAddChild,
  onEdit,
  onDelete,
  onUnlink,
}: TreeCanvasProps) {
  const { fitView, getIntersectingNodes } = useReactFlow();
  const prevNodeCountRef = useRef(treeNodes.length);

  const { flowNodes: layoutNodes, flowEdges: layoutEdges } = useMemo(
    () => buildFlowElements(treeNodes, direction),
    [treeNodes, direction]
  );

  const nodesWithCallbacks = useMemo(
    () =>
      layoutNodes.map((n) => ({
        ...n,
        data: { ...n.data, onAddChild, onEdit, onDelete, onUnlink, onFocus: onNodeClick },
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
    (_, node) => onNodeClick?.(node.data as unknown as TreeNodeData),
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
        if (targetNode) onNodeDrop(draggedNode.id, targetNode.id);
      }

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === draggedNode.id) {
            const original = nodesWithCallbacks.find((ln) => ln.id === n.id);
            if (original) return { ...n, position: original.position };
          }
          return n;
        })
      );
    },
    [onNodeDrop, getIntersectingNodes, setNodes, nodesWithCallbacks]
  );

  // ★ Edge click → ตัดสาย
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge.source, edge.target);
      }
    },
    [onEdgeClick]
  );

  const miniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as unknown as TreeNodeData;
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
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={true}
        defaultEdgeOptions={{
          type: "customEdge",
          animated: false,
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
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-background/80 px-10 py-10 text-center backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/30">
                <TreePine className="h-8 w-8 text-green-300" />
              </div>
              <p className="mt-4 text-base font-semibold text-foreground">
                ยังไม่มีคนในสายรหัส
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                กดปุ่ม &quot;+ เพิ่มคน&quot; ด้านบนเพื่อเริ่มสร้าง
              </p>
            </div>
          </Panel>
        )}

        {generations.length > 0 && (
          <Panel position="top-right">
            <div className="rounded-xl border bg-background/90 p-2.5 shadow-sm backdrop-blur-sm">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                สัญลักษณ์รุ่น
              </p>
              <div className="space-y-1">
                {generations.map((gen) => (
                  <div key={gen} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: getGenerationColor(gen) }}
                    />
                    <span className="text-xs text-muted-foreground">
                      รุ่น {gen}
                    </span>
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