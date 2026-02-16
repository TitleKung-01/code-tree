"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import {
  getInitials,
  getStatusLabel,
  getStatusColor,
} from "@/lib/tree/tree-utils";
import { GripVertical } from "lucide-react";

type TreeNodeComponentProps = NodeProps & {
  data: TreeNodeData;
};

function TreeNodeComponent({ data, selected, dragging }: TreeNodeComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const genColor = getGenerationColor(data.generation);
  const statusClasses = getStatusColor(data.status);

  return (
    <>
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400 hover:!bg-blue-500"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={() => setIsDragOver(false)}
      />

      {/* Node Card */}
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
            : isDragOver
              ? "border-green-500 shadow-green-100 ring-2 ring-green-200"
              : "border-gray-200"
          }
        `}
        style={{
          borderTopColor: dragging ? "#3b82f6" : genColor,
          borderTopWidth: "3px",
        }}
      >
        {/* Drag indicator + Header */}
        <div className="flex items-center gap-2">
          {/* Drag handle indicator */}
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

        {/* Footer */}
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

        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-50/80">
            <p className="text-xs font-medium text-green-600">
              วางที่นี่เพื่อย้ายสาย
            </p>
          </div>
        )}
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400 hover:!bg-blue-500"
      />
    </>
  );
}

export default memo(TreeNodeComponent);