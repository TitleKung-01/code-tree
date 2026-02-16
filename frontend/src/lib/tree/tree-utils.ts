import { TreeNodeData } from "./layout-engine";

// หา root nodes (ไม่มี parent)
export function findRootNodes(nodes: TreeNodeData[]): TreeNodeData[] {
  return nodes.filter((n) => n.parentIds.length === 0);
}

// หา children ของ node (nodes ที่มี parentId อยู่ใน parentIds)
export function findChildren(
  nodes: TreeNodeData[],
  parentId: string
): TreeNodeData[] {
  return nodes
    .filter((n) => n.parentIds.includes(parentId))
    .sort((a, b) => a.siblingOrder - b.siblingOrder);
}

// หา parents ทั้งหมดของ node (รองรับ multi-parent)
export function findParents(
  nodes: TreeNodeData[],
  node: TreeNodeData
): TreeNodeData[] {
  if (node.parentIds.length === 0) return [];
  return nodes.filter((n) => node.parentIds.includes(n.id));
}

// compat: หา parent ตัวแรก (สำหรับ code ที่ยังใช้ single parent)
export function findParent(
  nodes: TreeNodeData[],
  node: TreeNodeData
): TreeNodeData | undefined {
  if (node.parentIds.length === 0) return undefined;
  return nodes.find((n) => node.parentIds.includes(n.id));
}

// หา ancestors (สายพี่ขึ้นไปจนถึง root - รองรับ multi-parent)
export function findAncestors(
  nodes: TreeNodeData[],
  nodeId: string
): TreeNodeData[] {
  const ancestors: TreeNodeData[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  const startNode = nodes.find((n) => n.id === nodeId);
  if (!startNode) return ancestors;

  startNode.parentIds.forEach((pid) => queue.push(pid));

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const parent = nodes.find((n) => n.id === currentId);
    if (parent) {
      ancestors.push(parent);
      parent.parentIds.forEach((pid) => {
        if (!visited.has(pid)) queue.push(pid);
      });
    }
  }

  return ancestors;
}

// หา descendants (น้องทั้งหมดลงไป)
export function findDescendants(
  nodes: TreeNodeData[],
  nodeId: string
): TreeNodeData[] {
  const descendants: TreeNodeData[] = [];
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = nodes.filter(
      (n) => n.parentIds.includes(currentId) && !visited.has(n.id)
    );
    children.forEach((child) => {
      visited.add(child.id);
      descendants.push(child);
      queue.push(child.id);
    });
  }

  return descendants;
}

// นับจำนวนคนต่อรุ่น
export function countByGeneration(
  nodes: TreeNodeData[]
): Record<number, number> {
  const counts: Record<number, number> = {};
  nodes.forEach((n) => {
    counts[n.generation] = (counts[n.generation] || 0) + 1;
  });
  return counts;
}

// Status label ภาษาไทย
export function getStatusLabel(status: string): string {
  switch (status) {
    case "studying":
      return "กำลังศึกษา";
    case "graduated":
      return "จบแล้ว";
    case "retired":
      return "พ้นสภาพ";
    default:
      return status;
  }
}

// Status color
export function getStatusColor(status: string): string {
  switch (status) {
    case "studying":
      return "bg-green-100 text-green-700";
    case "graduated":
      return "bg-blue-100 text-blue-700";
    case "retired":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

// ตัวอักษรแรกของชื่อ (สำหรับ Avatar)
export function getInitials(nickname: string, firstName?: string): string {
  if (nickname) return nickname.charAt(0).toUpperCase();
  if (firstName) return firstName.charAt(0).toUpperCase();
  return "?";
}
