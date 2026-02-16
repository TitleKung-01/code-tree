"use client";

import { memo, useCallback } from "react";
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
  Eye,
  CircleDot,
  GraduationCap,
  UserCheck,
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

function getStatusDot(status: string) {
  switch (status) {
    case "studying":
      return "bg-emerald-500";
    case "graduated":
      return "bg-blue-500";
    case "retired":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

function getStatusIconSmall(status: string) {
  switch (status) {
    case "studying":
      return <CircleDot className="h-3 w-3" />;
    case "graduated":
      return <GraduationCap className="h-3 w-3" />;
    case "retired":
      return <UserCheck className="h-3 w-3" />;
    default:
      return <CircleDot className="h-3 w-3" />;
  }
}

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
        relative w-[210px] overflow-hidden rounded-xl border bg-background shadow-md
        transition-all duration-200
        ${dragging
          ? "scale-105 opacity-80 shadow-xl ring-2 ring-blue-400/50"
          : "hover:shadow-lg"
        }
        ${selected
          ? "ring-2 ring-blue-500/50 shadow-blue-500/10"
          : ""
        }
      `}
    >
      {/* Generation accent */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: genColor }}
      />

      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex shrink-0 cursor-grab items-center text-muted-foreground/30 active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-background">
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
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusDot(data.status)}`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {data.nickname}
            </p>
            {(data.firstName || data.lastName) && (
              <p className="truncate text-[11px] text-muted-foreground">
                {data.firstName} {data.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {data.studentId && (
            <Badge variant="outline" className="h-5 text-[10px] font-mono">
              {data.studentId}
            </Badge>
          )}
          <Badge
            className="h-5 text-[10px] text-white"
            style={{ backgroundColor: genColor }}
          >
            รุ่น {data.generation}
          </Badge>
          <Badge variant="secondary" className={`h-5 gap-0.5 text-[10px] ${statusClasses}`}>
            {getStatusIconSmall(data.status)}
            {getStatusLabel(data.status)}
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5! w-2.5! rounded-full! border-2! border-background! bg-muted-foreground/40! hover:bg-blue-500!"
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>{nodeCard}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback
                className="text-xs font-semibold text-white"
                style={{ backgroundColor: genColor }}
              >
                {getInitials(data.nickname)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{data.nickname}</p>
              <p className="text-[11px] text-muted-foreground">
                รุ่นที่ {data.generation}
                {data.studentId && ` · ${data.studentId}`}
              </p>
            </div>
          </div>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={() => data.onFocus?.(data)}>
            <Eye className="mr-2 h-4 w-4" />
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

          {data.parentIds.length > 0 && (
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
            ลบ {data.nickname}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5! w-2.5! rounded-full! border-2! border-background! bg-muted-foreground/40! hover:bg-blue-500!"
      />
    </>
  );
}

export default memo(TreeNodeComponent);