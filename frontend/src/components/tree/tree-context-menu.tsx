"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserPlus,
  Pencil,
  Trash2,
  Unlink,
  Eye,
  Copy,
} from "lucide-react";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials } from "@/lib/tree/tree-utils";

interface TreeContextMenuProps {
  children: React.ReactNode;
  node: TreeNodeData;
  onAddChild: (node: TreeNodeData) => void;
  onEdit: (node: TreeNodeData) => void;
  onDelete: (node: TreeNodeData) => void;
  onUnlink: (node: TreeNodeData) => void;
  onCopyId: (node: TreeNodeData) => void;
  onFocus: (node: TreeNodeData) => void;
}

export default function TreeContextMenu({
  children,
  node,
  onAddChild,
  onEdit,
  onDelete,
  onUnlink,
  onCopyId,
  onFocus,
}: TreeContextMenuProps) {
  const genColor = getGenerationColor(node.generation);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: genColor }}
            >
              {getInitials(node.nickname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{node.nickname}</p>
            <p className="text-[11px] text-muted-foreground">
              รุ่นที่ {node.generation}
              {node.studentId && ` · ${node.studentId}`}
            </p>
          </div>
        </div>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onFocus(node)}>
          <Eye className="mr-2 h-4 w-4" />
          ดูข้อมูล
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onAddChild(node)}>
          <UserPlus className="mr-2 h-4 w-4" />
          เพิ่มน้อง
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onEdit(node)}>
          <Pencil className="mr-2 h-4 w-4" />
          แก้ไขข้อมูล
        </ContextMenuItem>

        <ContextMenuSeparator />

        {node.parentIds.length > 0 && (
          <ContextMenuItem onClick={() => onUnlink(node)}>
            <Unlink className="mr-2 h-4 w-4" />
            ตัดสาย (เป็น root)
          </ContextMenuItem>
        )}

        <ContextMenuItem onClick={() => onCopyId(node)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy รหัส
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => onDelete(node)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          ลบ {node.nickname}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}