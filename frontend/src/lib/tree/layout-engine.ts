import Dagre from "dagre";

export interface TreeNodeData {
  id: string;
  parentIds: string[];
  nickname: string;
  firstName: string;
  lastName: string;
  studentId: string;
  generation: number;
  photoUrl: string;
  status: "studying" | "graduated" | "retired";
  siblingOrder: number;
  phone: string;
  email: string;
  lineId: string;
  discord: string;
  facebook: string;
  onAddChild?: (node: TreeNodeData) => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onUnlink?: (node: TreeNodeData) => void;
  onFocus?: (node: TreeNodeData) => void;
}

export interface LayoutNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: TreeNodeData;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export type LayoutDirection = "TB" | "LR";

// สุ่มสีไม่ซ้ำแต่ละรุ่น ใช้ Golden Angle (≈137.5°) กระจาย hue ใน HSL
// ให้สีทุกรุ่นห่างกันมากที่สุด ไม่มีวันซ้ำ
const generationColorCache = new Map<number, string>();

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getGenerationColor(generation: number): string {
  if (generation <= 0) return "#6b7280";

  const cached = generationColorCache.get(generation);
  if (cached) return cached;

  const hue = (generation * 137.508) % 360;
  const hex = hslToHex(hue, 65, 50);
  generationColorCache.set(generation, hex);
  return hex;
}

// ==================== หา Connected Component (รองรับ DAG) ====================
function getConnectedComponent(
  allNodes: TreeNodeData[],
  startId: string,
  visited: Set<string>
): TreeNodeData[] {
  const component: TreeNodeData[] = [];
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = allNodes.find((n) => n.id === currentId);
    if (!node) continue;
    component.push(node);

    // ไปทาง children (nodes ที่มี currentId เป็น parent)
    const children = allNodes.filter((n) => n.parentIds.includes(currentId));
    children.forEach((child) => {
      if (!visited.has(child.id)) queue.push(child.id);
    });

    // ไปทาง parents
    node.parentIds.forEach((pid) => {
      if (!visited.has(pid)) queue.push(pid);
    });
  }

  return component;
}

// ==================== Layout แต่ละ Subtree แยกกัน ====================
function layoutSubtree(
  nodes: TreeNodeData[],
  direction: LayoutDirection,
  offsetX: number,
  offsetY: number
): { layoutNodes: LayoutNode[]; layoutEdges: LayoutEdge[]; width: number; height: number } {
  const nodeWidth = 200;
  const nodeHeight = 100;

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: direction,
    nodesep: direction === "TB" ? 60 : 80,
    ranksep: direction === "TB" ? 120 : 160,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((n) => {
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });

  // Edges (รองรับ multi-parent: สร้าง edge จากทุก parentId)
  const edges: LayoutEdge[] = [];
  nodes.forEach((n) => {
    n.parentIds.forEach((pid) => {
      const parentNode = nodes.find((p) => p.id === pid);
      if (!parentNode) return;
      const edgeColor = getGenerationColor(parentNode.generation);

      edges.push({
        id: `edge-${pid}-${n.id}`,
        source: pid,
        target: n.id,
        type: "customEdge",
        animated: false,
        style: { stroke: edgeColor, strokeWidth: 2 },
        data: { sourceGeneration: parentNode.generation },
      });
    });
  });

  edges.forEach((e) => g.setEdge(e.source, e.target));

  Dagre.layout(g);

  // หาขนาดของ subtree
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach((n) => {
    const pos = g.node(n.id);
    minX = Math.min(minX, pos.x - nodeWidth / 2);
    maxX = Math.max(maxX, pos.x + nodeWidth / 2);
    minY = Math.min(minY, pos.y - nodeHeight / 2);
    maxY = Math.max(maxY, pos.y + nodeHeight / 2);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  // สร้าง layout nodes พร้อม offset
  const layoutNodes: LayoutNode[] = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "treeNode",
      position: {
        x: pos.x - nodeWidth / 2 - minX + offsetX,
        y: pos.y - nodeHeight / 2 - minY + offsetY,
      },
      data: n,
    };
  });

  return { layoutNodes, layoutEdges: edges, width, height };
}

// ==================== หา Connected Components ====================
function findConnectedComponents(nodes: TreeNodeData[]): TreeNodeData[][] {
  const visited = new Set<string>();
  const components: TreeNodeData[][] = [];

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const component = getConnectedComponent(nodes, node.id, visited);
      if (component.length > 0) {
        components.push(component);
      }
    }
  });

  return components;
}

// ==================== Main: Build Flow Elements ====================
export function buildFlowElements(
  nodes: TreeNodeData[],
  direction: LayoutDirection = "TB"
): {
  flowNodes: LayoutNode[];
  flowEdges: LayoutEdge[];
} {
  if (nodes.length === 0) {
    return { flowNodes: [], flowEdges: [] };
  }

  const components = findConnectedComponents(nodes);

  // component เดียว → layout ตรงๆ
  if (components.length <= 1) {
    const result = layoutSubtree(nodes, direction, 0, 0);
    return { flowNodes: result.layoutNodes, flowEdges: result.layoutEdges };
  }

  // หลาย components → layout แยกแล้ววางเรียงกัน
  return layoutMultipleComponents(components, direction);
}

// ★ Layout สำหรับ multiple connected components
function layoutMultipleComponents(
  components: TreeNodeData[][],
  direction: LayoutDirection
): { flowNodes: LayoutNode[]; flowEdges: LayoutEdge[] } {
  const allFlowNodes: LayoutNode[] = [];
  const allFlowEdges: LayoutEdge[] = [];

  const gap = direction === "TB" ? 100 : 120;
  let currentOffset = 0;

  // Sort components ตาม siblingOrder ของ root node แรก
  const sorted = [...components].sort((a, b) => {
    const rootA = a.find((n) => n.parentIds.length === 0);
    const rootB = b.find((n) => n.parentIds.length === 0);
    return (rootA?.siblingOrder || 0) - (rootB?.siblingOrder || 0);
  });

  sorted.forEach((component) => {
    const offsetX = direction === "TB" ? currentOffset : 0;
    const offsetY = direction === "LR" ? currentOffset : 0;

    const result = layoutSubtree(component, direction, offsetX, offsetY);

    allFlowNodes.push(...result.layoutNodes);
    allFlowEdges.push(...result.layoutEdges);

    if (direction === "TB") {
      currentOffset += result.width + gap;
    } else {
      currentOffset += result.height + gap;
    }
  });

  return { flowNodes: allFlowNodes, flowEdges: allFlowEdges };
}