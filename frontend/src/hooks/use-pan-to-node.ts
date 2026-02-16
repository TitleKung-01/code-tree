"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";

export function usePanToNode() {
  const { setCenter, getNode } = useReactFlow();

  const panToNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;

      // คำนวณ center ของ node
      const x = node.position.x + (node.measured?.width ?? 200) / 2;
      const y = node.position.y + (node.measured?.height ?? 100) / 2;

      setCenter(x, y, { zoom: 1, duration: 600 });
    },
    [setCenter, getNode]
  );

  return { panToNode };
}