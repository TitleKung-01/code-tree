import Dagre from "dagre";

export interface TreeNodeData {
  [key: string]: unknown;
  id: string;
  parentId: string | null;
  nickname: string;
  firstName: string;
  lastName: string;
  studentId: string;
  generation: number;
  photoUrl: string;
  status: "studying" | "graduated" | "retired";
  siblingOrder: number;
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
}

// สีตาม generation
export const GENERATION_COLORS: Record<number, string> = {
  1: "#3b82f6", // blue
  2: "#10b981", // green
  3: "#f59e0b", // amber
  4: "#ef4444", // red
  5: "#8b5cf6", // purple
  6: "#ec4899", // pink
  7: "#06b6d4", // cyan
  8: "#f97316", // orange
};

export function getGenerationColor(generation: number): string {
  return GENERATION_COLORS[generation] || "#6b7280"; // gray fallback
}

// แปลง flat nodes → React Flow nodes + edges
export function buildFlowElements(nodes: TreeNodeData[]): {
  flowNodes: LayoutNode[];
  flowEdges: LayoutEdge[];
} {
  if (nodes.length === 0) {
    return { flowNodes: [], flowEdges: [] };
  }

  // สร้าง edges จาก parent_id
  const flowEdges: LayoutEdge[] = nodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      id: `edge-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: "smoothstep",
    }));

  // ใช้ dagre คำนวณ layout
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: "TB",       // Top → Bottom
    nodesep: 60,         // ระยะห่างแนวนอน
    ranksep: 120,        // ระยะห่างแนวตั้ง (ระหว่าง generation)
    marginx: 40,
    marginy: 40,
  });

  // เพิ่ม nodes
  nodes.forEach((n) => {
    g.setNode(n.id, {
      width: 200,   // ความกว้าง node
      height: 100,  // ความสูง node
    });
  });

  // เพิ่ม edges
  flowEdges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  // คำนวณ layout
  Dagre.layout(g);

  // แปลงเป็น React Flow nodes
  const flowNodes: LayoutNode[] = nodes.map((n) => {
    const nodeWithPosition = g.node(n.id);
    return {
      id: n.id,
      type: "treeNode",
      position: {
        x: nodeWithPosition.x - 100,  // offset ครึ่ง width
        y: nodeWithPosition.y - 50,   // offset ครึ่ง height
      },
      data: n,
    };
  });

  return { flowNodes, flowEdges };
}

// สร้าง generation labels (แถบแบ่งรุ่น)
export function getGenerationLabels(nodes: TreeNodeData[]): {
  generation: number;
  y: number;
  label: string;
}[] {
  if (nodes.length === 0) return [];

  const genMap = new Map<number, number[]>();

  // TODO: ใช้ actual flow node positions หลัง layout
  // ตอนนี้ใช้ generation * spacing เป็น estimate
  const generations = [...new Set(nodes.map((n) => n.generation))].sort();

  return generations.map((gen) => ({
    generation: gen,
    y: (gen - 1) * 160,
    label: `รุ่นที่ ${gen}`,
  }));
}