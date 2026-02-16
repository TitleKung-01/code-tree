"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import { findDescendants } from "@/lib/tree/tree-utils";

interface UnlinkNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  node: TreeNodeData | null;
  allNodes: TreeNodeData[];
  loading?: boolean;
}

export default function UnlinkNodeDialog({
  open,
  onClose,
  onConfirm,
  node,
  allNodes,
  loading = false,
}: UnlinkNodeDialogProps) {
  if (!node) return null;

  const parent = allNodes.find((n) => n.id === node.parentId);
  const descendants = findDescendants(allNodes, node.id);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ตัดสาย &quot;{node.nickname}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{node.nickname}&quot; จะถูกตัดจากสาย
            &quot;{parent?.nickname || "?"}&quot; และกลายเป็น root node (รุ่นที่
            1)
            {descendants.length > 0 && (
              <>
                <br />
                น้องในสายของ &quot;{node.nickname}&quot; อีก{" "}
                {descendants.length} คน จะถูกคำนวณรุ่นใหม่ด้วย
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? "กำลังตัดสาย..." : "ตัดสาย"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}