"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, UserPlus, Navigation } from "lucide-react";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import {
  getInitials,
  getStatusLabel,
  getStatusColor,
  findChildren,
  findParent,
} from "@/lib/tree/tree-utils";

interface NodeDetailPanelProps {
  node: TreeNodeData | null;
  allNodes: TreeNodeData[];
  open: boolean;
  onClose: () => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onAddChild?: (parentNode: TreeNodeData) => void;
  onNodeSelect?: (node: TreeNodeData) => void;
  onNavigateToNode?: (nodeId: string) => void;
}

export default function NodeDetailPanel({
  node,
  allNodes,
  open,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onNodeSelect,
  onNavigateToNode,
}: NodeDetailPanelProps) {
  if (!node) return null;

  const genColor = getGenerationColor(node.generation);
  const parent = findParent(allNodes, node);
  const children = findChildren(allNodes, node.id);
  const statusClasses = getStatusColor(node.status);

  const handleNodeClick = (targetNode: TreeNodeData) => {
    // เปลี่ยน selected node
    onNodeSelect?.(targetNode);
    // Pan ไปที่ node นั้น
    onNavigateToNode?.(targetNode.id);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[350px] overflow-y-auto sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-lg">ข้อมูลสมาชิก</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20">
              {node.photoUrl && (
                <AvatarImage src={node.photoUrl} alt={node.nickname} />
              )}
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: genColor }}
              >
                {getInitials(node.nickname, node.firstName)}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-3 text-xl font-bold">{node.nickname}</h3>

            {(node.firstName || node.lastName) && (
              <p className="text-sm text-muted-foreground">
                {node.firstName} {node.lastName}
              </p>
            )}

            <div className="mt-2 flex gap-2">
              <Badge
                className="text-white"
                style={{ backgroundColor: genColor }}
              >
                รุ่นที่ {node.generation}
              </Badge>
              <Badge className={statusClasses}>
                {getStatusLabel(node.status)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            {node.studentId && (
              <DetailRow label="รหัสนักศึกษา" value={node.studentId} />
            )}
            <DetailRow label="รุ่นที่" value={`${node.generation}`} />
            <DetailRow label="สถานะ" value={getStatusLabel(node.status)} />
          </div>

          <Separator />

          {/* พี่รหัส */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">พี่รหัส</p>
            {parent ? (
              <NodeLink node={parent} onClick={() => handleNodeClick(parent)} />
            ) : (
              <p className="text-sm text-muted-foreground">
                ไม่มี (root node)
              </p>
            )}
          </div>

          {/* น้องรหัส */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              น้องรหัส ({children.length} คน)
            </p>
            {children.length > 0 ? (
              <div className="space-y-1">
                {children.map((child) => (
                  <NodeLink
                    key={child.id}
                    node={child}
                    onClick={() => handleNodeClick(child)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มีน้อง</p>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onAddChild?.(node)}
            >
              <UserPlus className="h-4 w-4" />
              เพิ่มน้องให้ {node.nickname}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onEdit?.(node)}
            >
              <Pencil className="h-4 w-4" />
              แก้ไขข้อมูล
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDelete?.(node)}
            >
              <Trash2 className="h-4 w-4" />
              ลบ {node.nickname}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Sub components
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function NodeLink({
  node,
  onClick,
}: {
  node: TreeNodeData;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border p-2 text-left transition hover:bg-gray-50"
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback
          className="text-xs text-white"
          style={{
            backgroundColor: getGenerationColor(node.generation),
          }}
        >
          {getInitials(node.nickname)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{node.nickname}</p>
        <p className="text-xs text-muted-foreground">
          รุ่นที่ {node.generation}
          {node.studentId && ` · ${node.studentId}`}
        </p>
      </div>
      <Navigation className="h-3 w-3 text-gray-400" />
    </button>
  );
}