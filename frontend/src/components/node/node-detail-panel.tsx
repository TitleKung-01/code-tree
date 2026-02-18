"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pencil,
  Trash2,
  UserPlus,
  ChevronRight,
  GraduationCap,
  Hash,
  Users,
  Crown,
  UserCheck,
  CircleDot,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import {
  getInitials,
  getStatusLabel,
  getStatusColor,
  findChildren,
  findParents,
} from "@/lib/tree/tree-utils";

interface NodeDetailPanelProps {
  node: TreeNodeData | null;
  allNodes: TreeNodeData[];
  open: boolean;
  onClose: () => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onAddChild?: (parentNode: TreeNodeData) => void;
  onNodeSelect?: (node: TreeNodeData) => void;
  onNavigateToNode?: (nodeId: string) => void;
}

function getStatusIcon(status: string) {
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

export default function NodeDetailPanel({
  node,
  allNodes,
  open,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onNodeSelect,
  onNavigateToNode,
}: NodeDetailPanelProps) {
  if (!node) return null;

  const genColor = getGenerationColor(node.generation);
  const parents = findParents(allNodes, node);
  const children = findChildren(allNodes, node.id);
  const statusClasses = getStatusColor(node.status);

  const handleNodeClick = (targetNode: TreeNodeData) => {
    onNodeSelect?.(targetNode);
    onNavigateToNode?.(targetNode.id);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="flex w-[380px] flex-col gap-0 overflow-y-auto p-0 sm:w-[420px]">
        {/* Hero Banner */}
        <div
          className="relative px-6 pb-14 pt-10"
          style={{
            background: `linear-gradient(135deg, ${genColor}18 0%, ${genColor}08 100%)`,
          }}
        >
          <SheetHeader className="p-0">
            <SheetTitle className="text-sm font-medium text-muted-foreground">
              ข้อมูลสมาชิก
            </SheetTitle>
          </SheetHeader>

          {/* Generation accent line */}
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: genColor }}
          />
        </div>

        {/* Avatar — overlaps banner and content */}
        <motion.div
          className="relative z-10 -mt-12 flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, type: "spring", stiffness: 200 }}
        >
          <div
            className="rounded-full p-1"
            style={{
              background: `linear-gradient(135deg, ${genColor}, ${genColor}99)`,
            }}
          >
            <Avatar className="h-20 w-20 border-4 border-background">
              {node.photoUrl && (
                <AvatarImage src={node.photoUrl} alt={node.nickname} />
              )}
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ backgroundColor: genColor }}
              >
                {getInitials(node.nickname, node.firstName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        {/* Identity */}
        <motion.div
          className="flex flex-col items-center px-6 pt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <h3 className="text-xl font-bold tracking-tight">
            {node.nickname}
          </h3>

          {(node.firstName || node.lastName) && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {node.firstName} {node.lastName}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Badge
              className="gap-1 text-white"
              style={{ backgroundColor: genColor }}
            >
              <Crown className="h-3 w-3" />
              รุ่นที่ {node.generation}
            </Badge>
            <Badge className={`gap-1 ${statusClasses}`}>
              {getStatusIcon(node.status)}
              {getStatusLabel(node.status)}
            </Badge>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          className="mt-5 px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
        >
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              {node.studentId && (
                <InfoCard
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="รหัสนักศึกษา"
                  value={node.studentId}
                  fullWidth
                />
              )}
              <InfoCard
                icon={<GraduationCap className="h-3.5 w-3.5" />}
                label="รุ่น"
                value={`รุ่นที่ ${node.generation}`}
              />
              <InfoCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="น้องรหัส"
                value={`${children.length} คน`}
              />
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        {(node.phone || node.email || node.lineId || node.discord || node.facebook) && (
          <motion.div
            className="mt-5 px-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
          >
            <div className="rounded-xl border bg-muted/30 p-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Phone className="h-3 w-3" />
                ช่องทางติดต่อ
              </h4>
              <div className="space-y-2">
                {node.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={`tel:${node.phone}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {node.phone}
                    </a>
                  </div>
                )}
                {node.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a
                      href={`mailto:${node.email}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {node.email}
                    </a>
                  </div>
                )}
                {node.lineId && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{node.lineId}</span>
                  </div>
                )}
                {node.discord && (
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    <span className="text-sm font-medium">{node.discord}</span>
                  </div>
                )}
                {node.facebook && (
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    {node.facebook.startsWith("http") ? (
                      <a
                        href={node.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {node.facebook}
                      </a>
                    ) : (
                      <span className="text-sm font-medium">{node.facebook}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Relationships */}
        <motion.div
          className="mt-5 flex-1 space-y-5 px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.45 }}
        >
          {/* Parents */}
          <RelationSection
            title="พี่รหัส"
            count={parents.length}
            emptyText="ไม่มีพี่รหัส (Root)"
            emptyIcon={<Crown className="h-8 w-8 text-muted-foreground/40" />}
          >
            {parents.map((parent) => (
              <NodeLink
                key={parent.id}
                node={parent}
                onClick={() => handleNodeClick(parent)}
              />
            ))}
          </RelationSection>

          {/* Children */}
          <RelationSection
            title="น้องรหัส"
            count={children.length}
            emptyText="ยังไม่มีน้องรหัส"
            emptyIcon={<Users className="h-8 w-8 text-muted-foreground/40" />}
            action={
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onAddChild?.(node)}
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>เพิ่มน้องรหัส</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
          >
            {children.map((child) => (
              <NodeLink
                key={child.id}
                node={child}
                onClick={() => handleNodeClick(child)}
              />
            ))}
          </RelationSection>
        </motion.div>

        {/* Actions — sticky bottom */}
        <div className="sticky bottom-0 border-t bg-background/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-white"
              style={{ backgroundColor: genColor }}
              onClick={() => onAddChild?.(node)}
            >
              <UserPlus className="h-4 w-4" />
              เพิ่มน้อง
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit?.(node)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>แก้ไขข้อมูล</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                    onClick={() => onDelete?.(node)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ลบ {node.nickname}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Sub-components ─── */

function InfoCard({
  icon,
  label,
  value,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-1 ${fullWidth ? "col-span-2" : ""}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function RelationSection({
  title,
  count,
  emptyText,
  emptyIcon,
  action,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  emptyIcon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">{title}</h4>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        </div>
        {action}
      </div>

      {count > 0 ? (
        <div className="space-y-1.5">{children}</div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-6 text-center">
          {emptyIcon}
          <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
        </div>
      )}
    </div>
  );
}

function NodeLink({
  node,
  onClick,
}: {
  node: TreeNodeData;
  onClick: () => void;
}) {
  const genColor = getGenerationColor(node.generation);
  const statusClasses = getStatusColor(node.status);

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border bg-background p-2.5 text-left transition-all hover:border-border/80 hover:bg-accent/50 hover:shadow-sm active:scale-[0.99]"
    >
      <Avatar className="h-9 w-9 ring-2 ring-background">
        {node.photoUrl && (
          <AvatarImage src={node.photoUrl} alt={node.nickname} />
        )}
        <AvatarFallback
          className="text-xs font-semibold text-white"
          style={{ backgroundColor: genColor }}
        >
          {getInitials(node.nickname)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{node.nickname}</p>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-medium"
            style={{ color: genColor }}
          >
            รุ่น {node.generation}
          </span>
          {node.studentId && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="truncate text-xs text-muted-foreground">
                {node.studentId}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Badge
          variant="secondary"
          className={`h-5 gap-0.5 px-1.5 text-[10px] ${statusClasses}`}
        >
          {getStatusIcon(node.status)}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
      </div>
    </button>
  );
}