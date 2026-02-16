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
import { Badge } from "@/components/ui/badge";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials, findDescendants } from "@/lib/tree/tree-utils";
import { Unlink, Loader2, AlertTriangle, ArrowRight, Crown } from "lucide-react";

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

  const genColor = getGenerationColor(node.generation);
  const parents = allNodes.filter((n) => node.parentIds.includes(n.id));
  const descendants = findDescendants(allNodes, node.id);

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
            <Unlink className="h-7 w-7 text-amber-600" />
          </div>
          <AlertDialogTitle>
            ตัดสาย &quot;{node.nickname}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            จะถูกตัดจากพี่ทั้งหมดและกลายเป็น Root Node
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Visual preview */}
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5">
            {parents.slice(0, 2).map((p) => (
              <Avatar key={p.id} className="h-7 w-7">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: getGenerationColor(p.generation) }}
                >
                  {getInitials(p.nickname)}
                </AvatarFallback>
              </Avatar>
            ))}
            {parents.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{parents.length - 2}
              </span>
            )}
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: genColor }}
              >
                {getInitials(node.nickname)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-medium">{node.nickname}</p>
              <Badge className="mt-0.5 gap-0.5 text-[9px] text-white" style={{ backgroundColor: getGenerationColor(1) }}>
                <Crown className="h-2.5 w-2.5" />
                รุ่น 1 (Root)
              </Badge>
            </div>
          </div>
        </div>

        {/* Warning */}
        {descendants.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                น้องในสายของ &quot;{node.nickname}&quot; อีก {descendants.length}{" "}
                คน จะถูกคำนวณรุ่นใหม่ด้วย
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="gap-2 bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังตัดสาย...
              </>
            ) : (
              <>
                <Unlink className="h-4 w-4" />
                ตัดสาย
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}