"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import {
  getInitials,
  getStatusLabel,
  getStatusColor,
} from "@/lib/tree/tree-utils";
import {
  GripVertical,
  UserPlus,
  Pencil,
  Trash2,
  Unlink,
  Copy,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

type TreeNodeComponentProps = NodeProps & {
  data: TreeNodeData & {
    onAddChild?: (node: TreeNodeData) => void;
    onEdit?: (node: TreeNodeData) => void;
    onDelete?: (node: TreeNodeData) => void;
    onUnlink?: (node: TreeNodeData) => void;
    onFocus?: (node: TreeNodeData) => void;
  };
};

function TreeNodeComponent({ data, selected, dragging }: TreeNodeComponentProps) {
  const genColor = getGenerationColor(data.generation);
  const statusClasses = getStatusColor(data.status);

  const handleCopyId = useCallback(() => {
    if (data.studentId) {
      navigator.clipboard.writeText(data.studentId);
      toast.success(`คัดลอก "${data.studentId}" แล้ว`);
    }
  }, [data.studentId]);

  const nodeCard = (
    <div
      className={`
        w-[200px] rounded-xl border-2 bg-white p-3 shadow-md
        transition-all duration-200
        ${dragging
          ? "scale-105 opacity-80 shadow-xl ring-2 ring-blue-300"
          : "hover:shadow-lg hover:scale-[1.02]"
        }
        ${selected
          ? "border-blue-500 shadow-blue-100 ring-2 ring-blue-200"
          : "border-gray-200"
        }
      `}
      style={{
        borderTopColor: dragging ? "#3b82f6" : genColor,
        borderTopWidth: "3px",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 cursor-grab items-center text-gray-300 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </div>

        <Avatar className="h-10 w-10 shrink-0">
          {data.photoUrl && (
            <AvatarImage src={data.photoUrl} alt={data.nickname} />
          )}
          <AvatarFallback
            className="text-sm font-bold text-white"
            style={{ backgroundColor: genColor }}
          >
            {getInitials(data.nickname, data.firstName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">
            {data.nickname}
          </p>
          {(data.firstName || data.lastName) && (
            <p className="truncate text-xs text-gray-500">
              {data.firstName} {data.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {data.studentId && (
          <Badge variant="outline" className="text-[10px] font-mono">
            {data.studentId}
          </Badge>
        )}
        <Badge
          className="text-[10px] text-white"
          style={{ backgroundColor: genColor }}
        >
          รุ่น {data.generation}
        </Badge>
        <Badge variant="secondary" className={`text-[10px] ${statusClasses}`}>
          {getStatusLabel(data.status)}
        </Badge>
      </div>
    </div>
  );

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400 hover:!bg-blue-500"
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>{nodeCard}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{data.nickname}</p>
            <p className="text-xs text-muted-foreground">
              รุ่นที่ {data.generation}
              {data.studentId && ` · ${data.studentId}`}
            </p>
          </div>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => data.onFocus?.(data)}>
            <Navigation className="mr-2 h-4 w-4" />
            ดูข้อมูล
          </ContextMenuItem>

          <ContextMenuItem onClick={() => data.onAddChild?.(data)}>
            <UserPlus className="mr-2 h-4 w-4" />
            เพิ่มน้อง
          </ContextMenuItem>

          <ContextMenuItem onClick={() => data.onEdit?.(data)}>
            <Pencil className="mr-2 h-4 w-4" />
            แก้ไขข้อมูล
          </ContextMenuItem>

          <ContextMenuSeparator />

          {data.parentId && (
            <ContextMenuItem onClick={() => data.onUnlink?.(data)}>
              <Unlink className="mr-2 h-4 w-4" />
              ตัดสาย (เป็น root)
            </ContextMenuItem>
          )}

          <ContextMenuItem onClick={handleCopyId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy รหัส
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => data.onDelete?.(data)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400 hover:!bg-blue-500"
      />
    </>
  );
}

export default memo(TreeNodeComponent);