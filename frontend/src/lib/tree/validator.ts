import { TreeNodeData } from "./layout-engine";
import { findDescendants } from "./tree-utils";

export interface MoveValidation {
  valid: boolean;
  error?: string;
}

// ตรวจสอบการเพิ่ม parent (รองรับ multi-parent / DAG)
export function validateAddParent(
  nodes: TreeNodeData[],
  childNodeId: string,
  newParentId: string
): MoveValidation {
  // 1. ห้ามเป็น parent ตัวเอง
  if (childNodeId === newParentId) {
    return { valid: false, error: "ไม่สามารถเป็นพี่ของตัวเองได้" };
  }

  const childNode = nodes.find((n) => n.id === childNodeId);
  const parentNode = nodes.find((n) => n.id === newParentId);

  if (!childNode || !parentNode) {
    return { valid: false, error: "ไม่พบ node" };
  }

  // 2. ถ้าเป็น parent อยู่แล้ว → ไม่ต้องเพิ่ม
  if (childNode.parentIds.includes(newParentId)) {
    return {
      valid: false,
      error: `"${childNode.nickname}" เป็นน้องของ "${parentNode.nickname}" อยู่แล้ว`,
    };
  }

  // 3. ห้ามเพิ่ม descendant เป็น parent (circular reference)
  const descendants = findDescendants(nodes, childNodeId);
  const isDescendant = descendants.some((d) => d.id === newParentId);

  if (isDescendant) {
    return {
      valid: false,
      error: `ไม่สามารถเพิ่มได้: "${parentNode.nickname}" เป็นน้องสายของ "${childNode.nickname}" อยู่แล้ว (จะเกิด circular reference)`,
    };
  }

  return { valid: true };
}

// backward compat alias
export function validateMove(
  nodes: TreeNodeData[],
  draggedNodeId: string,
  targetNodeId: string
): MoveValidation {
  return validateAddParent(nodes, draggedNodeId, targetNodeId);
}
