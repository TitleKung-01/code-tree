"use client";

import { useState, useEffect, useCallback } from "react";
import { treeClient } from "@/lib/grpc/clients/tree-client";
import { toast } from "sonner";

// Type จาก generated proto
interface Tree {
  id: string;
  name: string;
  description: string;
  faculty: string;
  department: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== List My Trees ====================

export function useMyTrees() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treeClient.listMyTrees({});
      const treesData = response.trees.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        faculty: t.faculty,
        department: t.department,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      setTrees(treesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้";
      setError(message);
      console.error("Failed to fetch trees:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  return { trees, loading, error, refetch: fetchTrees };
}

// ==================== Create Tree ====================

export function useCreateTree() {
  const [loading, setLoading] = useState(false);

  const createTree = async (data: {
    name: string;
    description: string;
    faculty: string;
    department: string;
  }): Promise<string | null> => {
    try {
      setLoading(true);

      const response = await treeClient.createTree({
        name: data.name,
        description: data.description,
        faculty: data.faculty,
        department: data.department,
      });

      toast.success("สร้างสายรหัสสำเร็จ!");
      return response.tree?.id || null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "สร้างสายรหัสไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to create tree:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createTree, loading };
}

// ==================== Delete Tree ====================

export function useDeleteTree() {
  const [loading, setLoading] = useState(false);

  const deleteTree = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await treeClient.deleteTree({ id });
      toast.success("ลบสายรหัสแล้ว");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ลบสายรหัสไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to delete tree:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteTree, loading };
}

// ==================== Get Single Tree ====================

export function useTree(treeId: string) {
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(treeId);
    if (!treeId || !isValidUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await treeClient.getTree({ id: treeId });
      if (response.tree) {
        setTree({
          id: response.tree.id,
          name: response.tree.name,
          description: response.tree.description,
          faculty: response.tree.faculty,
          department: response.tree.department,
          createdBy: response.tree.createdBy,
          createdAt: response.tree.createdAt,
          updatedAt: response.tree.updatedAt,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ไม่พบสายรหัส";
      setError(message);
      console.error("Failed to fetch tree:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return { tree, loading, error, refetch: fetchTree };
}