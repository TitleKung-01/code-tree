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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials, findDescendants } from "@/lib/tree/tree-utils";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

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

  const genColor = getGenerationColor(node.generation);
  const descendants = findDescendants(allNodes, node.id);
  const totalDelete = descendants.length + 1;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
            <Trash2 className="h-7 w-7 text-red-500" />
          </div>
          <AlertDialogTitle>ลบ &quot;{node.nickname}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            การลบจะไม่สามารถกู้คืนได้
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Node preview */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            {node.photoUrl && (
              <AvatarImage src={node.photoUrl} alt={node.nickname} />
            )}
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: genColor }}
            >
              {getInitials(node.nickname)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{node.nickname}</p>
            <p className="text-xs text-muted-foreground">
              {node.firstName} {node.lastName}
              {node.studentId && ` · ${node.studentId}`}
            </p>
          </div>
          <Badge
            className="text-[10px] text-white"
            style={{ backgroundColor: genColor }}
          >
            รุ่น {node.generation}
          </Badge>
        </div>

        {/* Warning */}
        {descendants.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  น้องในสายจะถูกลบด้วย!
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">
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
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                ลบ{descendants.length > 0 ? ` (${totalDelete} คน)` : ""}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}