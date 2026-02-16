"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";

const TreeEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const edgeColor = (style?.stroke as string) || "#94a3b8";

  return (
    <>
      {/* Invisible thick path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "pointer" }}
      />

      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: isHovered ? "#ef4444" : edgeColor,
          strokeWidth: isHovered ? 3 : 2,
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />

      {/* Delete button on hover */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600 hover:scale-110"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              title="ตัดสาย"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default TreeEdgeComponent;