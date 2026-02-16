"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type NodeMouseHandler,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TreeNodeComponent from "@/lib/tree/tree-node";
import { type TreeNodeData, buildFlowElements, getGenerationColor } from "@/lib/tree/layout-engine";

// ลงทะเบียน custom node types
const nodeTypes = {
  treeNode: TreeNodeComponent,
};

interface TreeCanvasProps {
  treeNodes: TreeNodeData[];
  onNodeClick?: (node: TreeNodeData) => void;
}

export default function TreeCanvas({
  treeNodes,
  onNodeClick,
}: TreeCanvasProps) {
  // คำนวณ layout
  const { flowNodes: initialNodes, flowEdges: initialEdges } = useMemo(
    () => buildFlowElements(treeNodes),
    [treeNodes]
  );

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (onNodeClick) {
        onNodeClick(node.data as TreeNodeData);
      }
    },
    [onNodeClick]
  );

  // MiniMap node color ตาม generation
  const miniMapNodeColor = useCallback((node: Node) => {
    const data = node.data as TreeNodeData;
    return getGenerationColor(data?.generation || 1);
  }, []);

  // Generation labels
  const generations = useMemo(() => {
    const gens = [...new Set(treeNodes.map((n) => n.generation))].sort();
    return gens;
  }, [treeNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: {
            stroke: "#94a3b8",
            strokeWidth: 2,
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* พื้นหลัง dots */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#e2e8f0"
        />

        {/* ปุ่ม Zoom Controls */}
        <Controls
          position="bottom-left"
          showInteractive={false}
        />

        {/* Minimap */}
        <MiniMap
          position="bottom-right"
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0,0,0,0.1)"
          className="!border-gray-200"
          pannable
          zoomable
        />

        {/* Empty State */}
        {treeNodes.length === 0 && (
          <Panel position="top-center" className="mt-20">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-lg font-medium text-gray-500">
                🌳 ยังไม่มีคนในสายรหัส
              </p>
              <p className="mt-1 text-sm text-gray-400">
                กดปุ่ม &quot;+ เพิ่มคน&quot; เพื่อเริ่มสร้างสายรหัส
              </p>
            </div>
          </Panel>
        )}

        {/* Generation Legend */}
        {generations.length > 0 && (
          <Panel position="top-right">
            <div className="rounded-lg border bg-white/90 p-3 shadow-sm backdrop-blur">
              <p className="mb-2 text-xs font-medium text-gray-500">
                สัญลักษณ์รุ่น
              </p>
              <div className="space-y-1">
                {generations.map((gen) => (
                  <div key={gen} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getGenerationColor(gen) }}
                    />
                    <span className="text-xs text-gray-600">
                      รุ่นที่ {gen}
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