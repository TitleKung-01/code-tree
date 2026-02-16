"use client";

import { useState, useEffect, useCallback } from "react";
import { nodeClient } from "@/lib/grpc/clients/node-client";
import { TreeNodeData } from "@/lib/tree/layout-engine";
import { toast } from "sonner";
import { Node } from "@/gen/node/v1/node_pb";

// แปลง proto node → TreeNodeData
function protoToTreeNode(n: Node): TreeNodeData {
  return {
    id: n.id,
    parentId: n.parentId || null,
    nickname: n.nickname,
    firstName: n.firstName || "",
    lastName: n.lastName || "",
    studentId: n.studentId || "",
    generation: n.generation,
    photoUrl: n.photoUrl || "",
    status: mapProtoStatus(n.status),
    siblingOrder: n.siblingOrder || 0,
  };
}

function mapProtoStatus(status: number): "studying" | "graduated" | "retired" {
  switch (status) {
    case 2:
      return "graduated";
    case 3:
      return "retired";
    default:
      return "studying";
  }
}

function mapStatusToProto(status: string): number {
  switch (status) {
    case "graduated":
      return 2;
    case "retired":
      return 3;
    default:
      return 1;
  }
}

// ==================== Get Tree Nodes ====================

export function useTreeNodes(treeId: string) {
  const [nodes, setNodes] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNodes = useCallback(async () => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(treeId);
    if (!treeId || !isValidUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await nodeClient.getTreeNodes({ treeId });
      const nodesData = response.nodes.map(protoToTreeNode);
      setNodes(nodesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลด nodes ได้";
      setError(message);
      console.error("Failed to fetch nodes:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  return { nodes, loading, error, refetch: fetchNodes };
}

// ==================== Create Node ====================

export function useCreateNode() {
  const [loading, setLoading] = useState(false);

  const createNode = async (data: {
    treeId: string;
    parentId?: string | null;
    nickname: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    photoUrl?: string;
    status?: string;
  }): Promise<TreeNodeData | null> => {
    try {
      setLoading(true);

      const response = await nodeClient.createNode({
        treeId: data.treeId,
        parentId: data.parentId || undefined,
        nickname: data.nickname,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        studentId: data.studentId || "",
        photoUrl: data.photoUrl || "",
        status: mapStatusToProto(data.status || "studying"),
      });

      toast.success(`เพิ่ม "${data.nickname}" สำเร็จ!`);

      if (response.node) {
        return protoToTreeNode(response.node);
      }
      return null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เพิ่มคนไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to create node:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createNode, loading };
}

// ==================== Update Node ====================

export function useUpdateNode() {
  const [loading, setLoading] = useState(false);

  const updateNode = async (data: {
    id: string;
    nickname: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    photoUrl?: string;
    status?: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);

      await nodeClient.updateNode({
        id: data.id,
        nickname: data.nickname,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        studentId: data.studentId || "",
        photoUrl: data.photoUrl || "",
        status: mapStatusToProto(data.status || "studying"),
      });

      toast.success("แก้ไขข้อมูลสำเร็จ!");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "แก้ไขไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to update node:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateNode, loading };
}

// ==================== Delete Node ====================

export function useDeleteNode() {
  const [loading, setLoading] = useState(false);

  const deleteNode = async (id: string, nickname: string): Promise<boolean> => {
    try {
      setLoading(true);

      await nodeClient.deleteNode({ id });

      toast.success(`ลบ "${nickname}" แล้ว`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ลบไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to delete node:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteNode, loading };
}

// ==================== Move Node ====================

export function useMoveNode() {
  const [loading, setLoading] = useState(false);

  const moveNode = async (
    nodeId: string,
    newParentId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      await nodeClient.moveNode({
        nodeId,
        newParentId,
        siblingOrder: 0,
      });

      toast.success("ย้ายสายสำเร็จ!");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ย้ายสายไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to move node:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { moveNode, loading };
}