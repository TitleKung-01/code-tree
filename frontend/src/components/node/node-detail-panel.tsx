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