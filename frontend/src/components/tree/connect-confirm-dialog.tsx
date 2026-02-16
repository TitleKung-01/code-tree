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
import { ArrowDown, AlertTriangle, GitBranch, Loader2 } from "lucide-react";

interface ConnectConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceNode: TreeNodeData | null;
  targetNode: TreeNodeData | null;
  allNodes: TreeNodeData[];
  loading?: boolean;
}

export default function ConnectConfirmDialog({
  open,
  onClose,
  onConfirm,
  sourceNode,
  targetNode,
  allNodes,
  loading = false,
}: ConnectConfirmDialogProps) {
  if (!sourceNode || !targetNode) return null;

  const isAlreadyChild = targetNode.parentIds.includes(sourceNode.id);
  const hasExistingParents = targetNode.parentIds.length > 0;
  const descendants = findDescendants(allNodes, targetNode.id);
  const hasDescendants = descendants.length > 0;
  const newGeneration = sourceNode.generation + 1;

  const oldParents = hasExistingParents
    ? allNodes.filter((n) => targetNode.parentIds.includes(n.id))
    : [];

  const title = hasExistingParents
    ? `เพิ่ม "${sourceNode.nickname}" เป็นพี่ของ "${targetNode.nickname}"?`
    : `ตั้ง "${sourceNode.nickname}" เป็นพี่ของ "${targetNode.nickname}"?`;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/30">
            <GitBranch className="h-7 w-7 text-blue-600" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasExistingParents ? (
              <>
                &quot;{targetNode.nickname}&quot; จะมี &quot;{sourceNode.nickname}&quot;
                เป็นพี่เพิ่มอีกคน
                {oldParents.length > 0 && (
                  <> (พี่เดิม: {oldParents.map((p) => `"${p.nickname}"`).join(", ")})</>
                )}
              </>
            ) : (
              <>
                &quot;{targetNode.nickname}&quot; จะเป็นน้องของ
                &quot;{sourceNode.nickname}&quot;
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Visual Preview */}
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4">
          <NodePreview node={sourceNode} label="พี่รหัส" />
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
          <NodePreview
            node={targetNode}
            label={`น้อง → รุ่นที่ ${newGeneration}`}
            newGeneration={newGeneration}
          />
        </div>

        {/* Warnings */}
        {(hasExistingParents || hasDescendants) && (
          <div className="space-y-2">
            {hasExistingParents && (
              <Warning
                text={`"${targetNode.nickname}" จะมีพี่รหัสหลายคน (${oldParents.length + 1} คน)`}
              />
            )}
            {hasDescendants && (
              <Warning
                text={`น้องในสายของ "${targetNode.nickname}" อีก ${descendants.length} คน อาจมีการคำนวณรุ่นใหม่`}
              />
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || isAlreadyChild}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                กำลังเพิ่มสาย...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                ยืนยันเพิ่มสาย
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NodePreview({
  node,
  label,
  newGeneration,
}: {
  node: TreeNodeData;
  label: string;
  newGeneration?: number;
}) {
  const gen = newGeneration || node.generation;
  const color = getGenerationColor(gen);

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border bg-background p-3">
      <Avatar className="h-10 w-10 ring-2 ring-background">
        <AvatarFallback
          className="text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(node.nickname)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-semibold">{node.nickname}</p>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] font-medium"
            style={{ backgroundColor: `${color}15`, color }}
          >
            รุ่นที่ {gen}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p className="text-xs text-amber-700 dark:text-amber-400">{text}</p>
    </div>
  );
}