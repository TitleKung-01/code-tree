"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  UserPlus,
  Pencil,
  Trash2,
  Unlink,
  Navigation,
  Copy,
} from "lucide-react";
import { TreeNodeData } from "@/lib/tree/layout-engine";

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
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {/* Header */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{node.nickname}</p>
          <p className="text-xs text-muted-foreground">
            รุ่นที่ {node.generation}
            {node.studentId && ` · ${node.studentId}`}
          </p>
        </div>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onFocus(node)}>
          <Navigation className="mr-2 h-4 w-4" />
          ดูข้อมูล
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onAddChild(node)}>
          <UserPlus className="mr-2 h-4 w-4" />
          เพิ่มน้องให้ {node.nickname}
        </ContextMenuItem>

        <ContextMenuItem onClick={() => onEdit(node)}>
          <Pencil className="mr-2 h-4 w-4" />
          แก้ไขข้อมูล
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* ตัดสาย (เฉพาะ node ที่ไม่ใช่ root) */}
        {node.parentId && (
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