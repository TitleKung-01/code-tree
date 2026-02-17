"use client";

import { useState, useEffect, useCallback } from "react";
import { treeClient } from "@/lib/grpc/clients/tree-client";
import { ShareRole } from "@/gen/tree/v1/tree_pb";
import { toast } from "sonner";

// ==================== Types ====================

export interface TreeShareData {
  id: string;
  treeId: string;
  userId: string;
  role: ShareRole;
  userEmail: string;
  userDisplayName: string;
  userAvatarUrl: string;
  invitedBy: string;
  createdAt: string;
}

export interface SharedTree {
  id: string;
  name: string;
  description: string;
  faculty: string;
  department: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  myRole: ShareRole;
}

// ==================== Helper ====================

export function roleToLabel(role: ShareRole): string {
  switch (role) {
    case ShareRole.VIEWER:
      return "ดูอย่างเดียว";
    case ShareRole.EDITOR:
      return "แก้ไขได้";
    case ShareRole.OWNER:
      return "เจ้าของร่วม";
    default:
      return "ไม่มีสิทธิ์";
  }
}

export function roleToLabelEN(role: ShareRole): string {
  switch (role) {
    case ShareRole.VIEWER:
      return "Viewer";
    case ShareRole.EDITOR:
      return "Editor";
    case ShareRole.OWNER:
      return "Owner";
    default:
      return "None";
  }
}

export function canEdit(role: ShareRole): boolean {
  return role === ShareRole.EDITOR || role === ShareRole.OWNER;
}

// ==================== List Tree Shares ====================

export function useTreeShares(treeId: string) {
  const [shares, setShares] = useState<TreeShareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    if (!treeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await treeClient.listTreeShares({ treeId });
      const sharesData = response.shares.map((s) => ({
        id: s.id,
        treeId: s.treeId,
        userId: s.userId,
        role: s.role,
        userEmail: s.userEmail,
        userDisplayName: s.userDisplayName,
        userAvatarUrl: s.userAvatarUrl,
        invitedBy: s.invitedBy,
        createdAt: s.createdAt,
      }));

      setShares(sharesData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลการแชร์ได้";
      setError(message);
      console.error("Failed to fetch shares:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  return { shares, loading, error, refetch: fetchShares };
}

// ==================== Share Tree ====================

export function useShareTree() {
  const [loading, setLoading] = useState(false);

  const shareTree = async (data: {
    treeId: string;
    email: string;
    role: ShareRole;
  }): Promise<TreeShareData | null> => {
    try {
      setLoading(true);

      const response = await treeClient.shareTree({
        treeId: data.treeId,
        email: data.email,
        role: data.role,
      });

      toast.success(`แชร์ให้ ${data.email} สำเร็จ!`);

      if (response.share) {
        return {
          id: response.share.id,
          treeId: response.share.treeId,
          userId: response.share.userId,
          role: response.share.role,
          userEmail: response.share.userEmail,
          userDisplayName: response.share.userDisplayName,
          userAvatarUrl: response.share.userAvatarUrl,
          invitedBy: response.share.invitedBy,
          createdAt: response.share.createdAt,
        };
      }
      return null;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "แชร์ไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to share tree:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { shareTree, loading };
}

// ==================== Update Share Role ====================

export function useUpdateShare() {
  const [loading, setLoading] = useState(false);

  const updateShare = async (data: {
    treeId: string;
    userId: string;
    role: ShareRole;
  }): Promise<boolean> => {
    try {
      setLoading(true);

      await treeClient.updateShare({
        treeId: data.treeId,
        userId: data.userId,
        role: data.role,
      });

      toast.success("อัปเดตสิทธิ์สำเร็จ!");
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "อัปเดตสิทธิ์ไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to update share:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateShare, loading };
}

// ==================== Remove Share ====================

export function useRemoveShare() {
  const [loading, setLoading] = useState(false);

  const removeShare = async (
    treeId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      await treeClient.removeShare({ treeId, userId });

      toast.success("ลบการแชร์แล้ว");
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ลบการแชร์ไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to remove share:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { removeShare, loading };
}

// ==================== List Shared With Me ====================

export function useSharedWithMe() {
  const [trees, setTrees] = useState<SharedTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedTrees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await treeClient.listSharedWithMe({});
      const treesData = response.trees.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        faculty: t.faculty,
        department: t.department,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        myRole: t.myRole,
      }));

      setTrees(treesData);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดรายการแชร์ได้";
      setError(message);
      console.error("Failed to fetch shared trees:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedTrees();
  }, [fetchSharedTrees]);

  return { trees, loading, error, refetch: fetchSharedTrees };
}

// ==================== Get My Role ====================

export function useMyRole(treeId: string) {
  const [role, setRole] = useState<ShareRole>(ShareRole.UNSPECIFIED);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    const isValidUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        treeId
      );
    if (!treeId || !isValidUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await treeClient.getMyRole({ treeId });
      setRole(response.role);
      setIsCreator(response.isCreator);
    } catch (err: unknown) {
      console.error("Failed to fetch role:", err);
      setRole(ShareRole.UNSPECIFIED);
      setIsCreator(false);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return { role, isCreator, loading, refetch: fetchRole };
}
