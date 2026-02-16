"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials, getStatusLabel, getStatusColor } from "@/lib/tree/tree-utils";

type TreeNodeComponentProps = NodeProps & {
  data: TreeNodeData;
};

function TreeNodeComponent({ data, selected }: TreeNodeComponentProps) {
  const genColor = getGenerationColor(data.generation);
  const statusClasses = getStatusColor(data.status);

  return (
    <>
      {/* Target Handle (ด้านบน — รับเส้นจากพี่) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />

      {/* Node Card */}
      <div
        className={`
          w-[200px] rounded-xl border-2 bg-white p-3 shadow-md
          transition-all duration-200
          hover:shadow-lg hover:scale-[1.02]
          ${selected
            ? "border-blue-500 shadow-blue-100 ring-2 ring-blue-200"
            : "border-gray-200"
          }
        `}
        style={{
          borderTopColor: genColor,
          borderTopWidth: "3px",
        }}
      >
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-3">
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
            {/* ชื่อเล่น */}
            <p className="truncate text-sm font-bold text-gray-900">
              {data.nickname}
            </p>

            {/* ชื่อจริง */}
            {(data.firstName || data.lastName) && (
              <p className="truncate text-xs text-gray-500">
                {data.firstName} {data.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Footer: รหัส + รุ่น + สถานะ */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {/* รหัสนักศึกษา */}
          {data.studentId && (
            <Badge variant="outline" className="text-[10px] font-mono">
              {data.studentId}
            </Badge>
          )}

          {/* รุ่น */}
          <Badge
            className="text-[10px] text-white"
            style={{ backgroundColor: genColor }}
          >
            รุ่น {data.generation}
          </Badge>

          {/* สถานะ */}
          <Badge variant="secondary" className={`text-[10px] ${statusClasses}`}>
            {getStatusLabel(data.status)}
          </Badge>
        </div>
      </div>

      {/* Source Handle (ด้านล่าง — ลากเส้นไปน้อง) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
      />
    </>
  );
}

export default memo(TreeNodeComponent);