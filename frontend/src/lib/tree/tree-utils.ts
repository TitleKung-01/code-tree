import { TreeNodeData } from "./layout-engine";

// หา root nodes (ไม่มี parent)
export function findRootNodes(nodes: TreeNodeData[]): TreeNodeData[] {
  return nodes.filter((n) => n.parentId === null);
}

// หา children ของ node
export function findChildren(
  nodes: TreeNodeData[],
  parentId: string
): TreeNodeData[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.siblingOrder - b.siblingOrder);
}

// หา parent ของ node
export function findParent(
  nodes: TreeNodeData[],
  node: TreeNodeData
): TreeNodeData | undefined {
  if (!node.parentId) return undefined;
  return nodes.find((n) => n.id === node.parentId);
}

// หา ancestors (สายพี่ขึ้นไปจนถึง root)
export function findAncestors(
  nodes: TreeNodeData[],
  nodeId: string
): TreeNodeData[] {
  const ancestors: TreeNodeData[] = [];
  let current = nodes.find((n) => n.id === nodeId);

  while (current?.parentId) {
    const parent = nodes.find((n) => n.id === current!.parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
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
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = nodes.filter((n) => n.parentId === currentId);
    children.forEach((child) => {
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