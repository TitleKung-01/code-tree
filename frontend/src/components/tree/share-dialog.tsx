"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useTreeShares,
  useShareTree,
  useUpdateShare,
  useRemoveShare,
  roleToLabel,
  type TreeShareData,
} from "@/hooks/use-shares";
import { treeClient } from "@/lib/grpc/clients/tree-client";
import { ShareRole } from "@/gen/tree/v1/tree_pb";
import { toast } from "sonner";
import {
  Share2,
  UserPlus,
  Loader2,
  Crown,
  Eye,
  Pencil,
  X,
  Users,
  Link2,
  Copy,
  Check,
  Globe,
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  treeId: string;
  treeName: string;
  isCreator: boolean;
}

export default function ShareDialog({
  open,
  onClose,
  treeId,
  treeName,
  isCreator,
}: ShareDialogProps) {
  const { shares, loading: sharesLoading, refetch } = useTreeShares(treeId);
  const { shareTree, loading: sharing } = useShareTree();
  const { updateShare, loading: updating } = useUpdateShare();
  const { removeShare, loading: removing } = useRemoveShare();

  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<ShareRole>(
    ShareRole.VIEWER
  );
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (!email.trim()) return;

    const result = await shareTree({
      treeId,
      email: email.trim(),
      role: selectedRole,
    });

    if (result) {
      setEmail("");
      setSelectedRole(ShareRole.VIEWER);
      refetch();
    }
  }, [email, selectedRole, treeId, shareTree, refetch]);

  const handleUpdateRole = useCallback(
    async (userId: string, role: ShareRole) => {
      const success = await updateShare({ treeId, userId, role });
      if (success) {
        refetch();
      }
    },
    [treeId, updateShare, refetch]
  );

  const handleRemove = useCallback(
    async (userId: string) => {
      const success = await removeShare(treeId, userId);
      if (success) {
        refetch();
      }
    },
    [treeId, removeShare, refetch]
  );

  const handleGenerateLink = useCallback(async () => {
    try {
      setGeneratingLink(true);
      const response = await treeClient.generateShareLink({ treeId });
      const fullUrl = `${window.location.origin}/share/${response.shareToken}`;
      setShareLink(fullUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "สร้างลิงก์ไม่สำเร็จ";
      toast.error(message);
      console.error("Failed to generate share link:", err);
    } finally {
      setGeneratingLink(false);
    }
  }, [treeId]);

  const handleCopyLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast.success("คัดลอกลิงก์แล้ว!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }, [shareLink]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && email.trim()) {
        e.preventDefault();
        handleShare();
      }
    },
    [email, handleShare]
  );

  const getRoleIcon = (role: ShareRole) => {
    switch (role) {
      case ShareRole.OWNER:
        return <Crown className="h-3 w-3" />;
      case ShareRole.EDITOR:
        return <Pencil className="h-3 w-3" />;
      case ShareRole.VIEWER:
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (
    role: ShareRole
  ): "default" | "secondary" | "outline" => {
    switch (role) {
      case ShareRole.OWNER:
        return "default";
      case ShareRole.EDITOR:
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600" />
            แชร์สายรหัส
          </DialogTitle>
          <DialogDescription>
            แชร์ &quot;{treeName}&quot; ให้คนอื่นดูหรือแก้ไขได้
          </DialogDescription>
        </DialogHeader>

        {/* Public share link */}
        {isCreator && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>ลิงก์แชร์สาธารณะ (ไม่ต้อง login)</span>
            </div>

            {shareLink ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="flex-1 text-xs bg-muted/50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopyLink}
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleGenerateLink}
                disabled={generatingLink}
              >
                {generatingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                สร้างลิงก์แชร์
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Add new share (by email) */}
        {isCreator && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              <span>แชร์ให้ผู้ใช้ (ต้องมีบัญชี)</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="ใส่อีเมลผู้ใช้..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sharing}
                />
              </div>
              <Select
                value={String(selectedRole)}
                onValueChange={(v) => setSelectedRole(Number(v) as ShareRole)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ShareRole.VIEWER)}>
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      ดูอย่างเดียว
                    </div>
                  </SelectItem>
                  <SelectItem value={String(ShareRole.EDITOR)}>
                    <div className="flex items-center gap-2">
                      <Pencil className="h-3.5 w-3.5" />
                      แก้ไขได้
                    </div>
                  </SelectItem>
                  <SelectItem value={String(ShareRole.OWNER)}>
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5" />
                      เจ้าของร่วม
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleShare}
                disabled={sharing || !email.trim()}
                size="icon"
                className="shrink-0 bg-green-600 hover:bg-green-700"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Separator />
          </>
        )}

        {/* Share list */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {shares.length === 0
                ? "ยังไม่ได้แชร์ให้ใคร"
                : `แชร์ให้ ${shares.length} คน`}
            </span>
          </div>

          {sharesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {shares.map((share) => (
                <ShareItem
                  key={share.id}
                  share={share}
                  isCreator={isCreator}
                  onUpdateRole={handleUpdateRole}
                  onRemove={handleRemove}
                  updating={updating}
                  removing={removing}
                  getRoleIcon={getRoleIcon}
                  getRoleBadgeVariant={getRoleBadgeVariant}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== ShareItem ====================

interface ShareItemProps {
  share: TreeShareData;
  isCreator: boolean;
  onUpdateRole: (userId: string, role: ShareRole) => void;
  onRemove: (userId: string) => void;
  updating: boolean;
  removing: boolean;
  getRoleIcon: (role: ShareRole) => React.ReactNode;
  getRoleBadgeVariant: (
    role: ShareRole
  ) => "default" | "secondary" | "outline";
  getInitials: (name: string, email: string) => string;
}

function ShareItem({
  share,
  isCreator,
  onUpdateRole,
  onRemove,
  updating,
  removing,
  getRoleIcon,
  getRoleBadgeVariant,
  getInitials,
}: ShareItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50">
      <Avatar size="sm">
        {share.userAvatarUrl ? (
          <AvatarImage src={share.userAvatarUrl} />
        ) : null}
        <AvatarFallback>
          {getInitials(share.userDisplayName, share.userEmail)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {share.userDisplayName || share.userEmail}
        </p>
        {share.userDisplayName && (
          <p className="truncate text-xs text-muted-foreground">
            {share.userEmail}
          </p>
        )}
      </div>

      {isCreator ? (
        <div className="flex items-center gap-1">
          <Select
            value={String(share.role)}
            onValueChange={(v) =>
              onUpdateRole(share.userId, Number(v) as ShareRole)
            }
            disabled={updating}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(ShareRole.VIEWER)}>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  ดูอย่างเดียว
                </div>
              </SelectItem>
              <SelectItem value={String(ShareRole.EDITOR)}>
                <div className="flex items-center gap-1.5">
                  <Pencil className="h-3 w-3" />
                  แก้ไขได้
                </div>
              </SelectItem>
              <SelectItem value={String(ShareRole.OWNER)}>
                <div className="flex items-center gap-1.5">
                  <Crown className="h-3 w-3" />
                  เจ้าของร่วม
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-600"
            onClick={() => onRemove(share.userId)}
            disabled={removing}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Badge
          variant={getRoleBadgeVariant(share.role)}
          className="gap-1 text-[10px]"
        >
          {getRoleIcon(share.role)}
          {roleToLabel(share.role)}
        </Badge>
      )}
    </div>
  );
}
