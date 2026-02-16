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
import { ArrowDown, AlertTriangle } from "lucide-react";

interface ConnectConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceNode: TreeNodeData | null;  // จะเป็น parent ใหม่
  targetNode: TreeNodeData | null;  // จะถูกย้าย
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

  const isAlreadyChild = targetNode.parentId === sourceNode.id;
  const hasExistingParent = targetNode.parentId !== null;
  const descendants = findDescendants(allNodes, targetNode.id);
  const hasDescendants = descendants.length > 0;
  const newGeneration = sourceNode.generation + 1;

  // หา parent เดิม
  const oldParent = hasExistingParent
    ? allNodes.find((n) => n.id === targetNode.parentId)
    : null;

  const title = hasExistingParent
    ? `ย้าย "${targetNode.nickname}" ไปสาย "${sourceNode.nickname}"?`
    : `ตั้ง "${sourceNode.nickname}" เป็นพี่ของ "${targetNode.nickname}"?`;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasExistingParent ? (
              <>
                &quot;{targetNode.nickname}&quot; จะถูกย้ายจากสาย
                &quot;{oldParent?.nickname || "?"}&quot; ไปเป็นน้องของ
                &quot;{sourceNode.nickname}&quot;
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
        <div className="flex flex-col items-center gap-2 py-4">
          <NodePreview node={sourceNode} label="พี่รหัส" />
          <ArrowDown className="h-5 w-5 text-gray-400" />
          <NodePreview
            node={targetNode}
            label={`น้อง → รุ่นที่ ${newGeneration}`}
            newGeneration={newGeneration}
          />
        </div>

        {/* Warnings */}
        <div className="space-y-2">
          {hasExistingParent && (
            <Warning
              text={`"${targetNode.nickname}" จะย้ายจากสาย "${oldParent?.nickname || "?"}" มาสาย "${sourceNode.nickname}"`}
            />
          )}

          {hasDescendants && (
            <Warning
              text={`น้องในสายของ "${targetNode.nickname}" อีก ${descendants.length} คน จะย้ายตามมาด้วย และรุ่นจะถูกคำนวณใหม่`}
            />
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading || isAlreadyChild}
          >
            {loading ? "กำลังย้าย..." : "ยืนยันย้ายสาย"}
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
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-10 w-10">
        <AvatarFallback
          className="text-sm text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(node.nickname)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{node.nickname}</p>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-[10px]"
            style={{ backgroundColor: `${color}20`, color }}
          >
            รุ่นที่ {gen}
          </Badge>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p className="text-xs text-amber-700">{text}</p>
    </div>
  );
}