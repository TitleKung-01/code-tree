import { TreeNodeData } from "./layout-engine";
import { findDescendants } from "./tree-utils";

export interface MoveValidation {
  valid: boolean;
  error?: string;
}

export function validateMove(
  nodes: TreeNodeData[],
  draggedNodeId: string,
  targetNodeId: string
): MoveValidation {
  // 1. ห้ามย้ายไปตัวเอง
  if (draggedNodeId === targetNodeId) {
    return { valid: false, error: "ไม่สามารถย้ายไปเป็นน้องตัวเองได้" };
  }

  const draggedNode = nodes.find((n) => n.id === draggedNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  if (!draggedNode || !targetNode) {
    return { valid: false, error: "ไม่พบ node" };
  }

  // 2. ถ้า target เป็น parent อยู่แล้ว → ไม่ต้องย้าย
  if (draggedNode.parentId === targetNodeId) {
    return { valid: false, error: `"${draggedNode.nickname}" เป็นน้องของ "${targetNode.nickname}" อยู่แล้ว` };
  }

  // 3. ห้ามย้ายไป descendant ของตัวเอง (circular reference)
  const descendants = findDescendants(nodes, draggedNodeId);
  const isDescendant = descendants.some((d) => d.id === targetNodeId);

  if (isDescendant) {
    return {
      valid: false,
      error: `ไม่สามารถย้ายได้: "${targetNode.nickname}" เป็นน้องสายของ "${draggedNode.nickname}" อยู่แล้ว (จะเกิด circular reference)`,
    };
  }

  return { valid: true };
}