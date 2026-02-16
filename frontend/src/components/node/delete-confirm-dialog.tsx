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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials, findDescendants } from "@/lib/tree/tree-utils";
import { AlertTriangle } from "lucide-react";

interface DeleteNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  node: TreeNodeData | null;
  allNodes: TreeNodeData[];
  loading?: boolean;
}

export default function DeleteNodeDialog({
  open,
  onClose,
  onConfirm,
  node,
  allNodes,
  loading = false,
}: DeleteNodeDialogProps) {
  if (!node) return null;

  const descendants = findDescendants(allNodes, node.id);
  const totalDelete = descendants.length + 1; // node + descendants

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ &quot;{node.nickname}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            การลบจะไม่สามารถกู้คืนได้
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Node preview */}
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback
              className="text-sm text-white"
              style={{
                backgroundColor: getGenerationColor(node.generation),
              }}
            >
              {getInitials(node.nickname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{node.nickname}</p>
            <p className="text-xs text-muted-foreground">
              {node.firstName} {node.lastName}
              {node.studentId && ` · ${node.studentId}`}
            </p>
          </div>
        </div>

        {/* Warning */}
        {descendants.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-medium text-red-700">
                น้องในสายจะถูกลบด้วย!
              </p>
              <p className="mt-1 text-xs text-red-600">
                จะลบทั้งหมด {totalDelete} คน: {node.nickname}
                {descendants.length > 0 && (
                  <>
                    {" "}
                    และ{" "}
                    {descendants
                      .slice(0, 3)
                      .map((d) => d.nickname)
                      .join(", ")}
                    {descendants.length > 3 &&
                      ` อีก ${descendants.length - 3} คน`}
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading
              ? "กำลังลบ..."
              : `ลบ${descendants.length > 0 ? ` (${totalDelete} คน)` : ""}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}