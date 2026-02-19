"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserPlus,
  LayoutGrid,
  Maximize,
  Search,
  ArrowLeft,
  ArrowDownUp,
  ArrowLeftRight,
  Users,
  GitBranch,
  Table2,
  Share2,
  Eye,
  Pencil,
  Crown,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useReactFlow } from "@xyflow/react";
import type { LayoutDirection } from "@/lib/tree/layout-engine";
import { ShareRole } from "@/gen/tree/v1/tree_pb";
import { motion } from "framer-motion";

export type ViewMode = "graph" | "table";

interface TreeToolbarProps {
  treeName: string;
  nodeCount: number;
  direction: LayoutDirection;
  viewMode: ViewMode;
  onAddNode?: () => void;
  onAutoLayout?: () => void;
  onSearch?: () => void;
  onToggleDirection?: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onShare?: () => void;
  canEdit?: boolean;
  myRole?: ShareRole;
  isCreator?: boolean;
}

export default function TreeToolbar({
  treeName,
  nodeCount,
  direction,
  viewMode,
  onAddNode,
  onAutoLayout,
  onSearch,
  onToggleDirection,
  onViewModeChange,
  onShare,
  canEdit = true,
  myRole,
  isCreator,
}: TreeToolbarProps) {
  const { fitView } = useReactFlow();

  const getRoleBadge = () => {
    if (isCreator) return null;
    if (!myRole) return null;

    const config = {
      [ShareRole.VIEWER]: {
        icon: <Eye className="h-2.5 w-2.5" />,
        label: "ดูอย่างเดียว",
        className: "border-orange-200 text-orange-700 bg-orange-50",
      },
      [ShareRole.EDITOR]: {
        icon: <Pencil className="h-2.5 w-2.5" />,
        label: "แก้ไขได้",
        className: "border-blue-200 text-blue-700 bg-blue-50",
      },
      [ShareRole.OWNER]: {
        icon: <Crown className="h-2.5 w-2.5" />,
        label: "เจ้าของร่วม",
        className: "border-purple-200 text-purple-700 bg-purple-50",
      },
    }[myRole] || null;

    if (!config) return null;

    return (
      <Badge
        variant="outline"
        className={`gap-1 text-[10px] font-medium ${config.className}`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleFitView = () => {
    fitView({ padding: 0.3, maxZoom: 1.2, duration: 500 });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className="flex h-12 items-center justify-between border-b bg-background/80 px-3 backdrop-blur-md md:grid md:grid-cols-3"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/trees">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>กลับหน้ารายการ</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{treeName}</h1>
            <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] font-medium">
              <Users className="h-2.5 w-2.5" />
              {nodeCount}
            </Badge>
            {getRoleBadge()}
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className="flex items-center gap-1 md:hidden">
          {canEdit && onAddNode && (
            <Button
              size="sm"
              onClick={onAddNode}
              className="h-8 gap-1.5 rounded-md bg-linear-to-r from-green-600 to-emerald-500 px-2.5 text-xs shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSearch}>
                <Search className="h-4 w-4" />
                ค้นหา
              </DropdownMenuItem>

              {viewMode === "graph" && (
                <>
                  <DropdownMenuItem onClick={onAutoLayout}>
                    <LayoutGrid className="h-4 w-4" />
                    จัดเรียงอัตโนมัติ
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onToggleDirection}>
                    {direction === "TB" ? (
                      <ArrowLeftRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownUp className="h-4 w-4" />
                    )}
                    {direction === "TB"
                      ? "เปลี่ยนเป็นแนวนอน"
                      : "เปลี่ยนเป็นแนวตั้ง"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleFitView}>
                    <Maximize className="h-4 w-4" />
                    พอดีจอ
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              {onShare && (
                <DropdownMenuItem onClick={onShare}>
                  <Share2 className="h-4 w-4" />
                  แชร์สายรหัส
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onViewModeChange?.("graph")}>
                <GitBranch className="h-4 w-4" />
                มุมมองกราฟ
                {viewMode === "graph" && (
                  <span className="ml-auto text-xs text-green-500">●</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewModeChange?.("table")}>
                <Table2 className="h-4 w-4" />
                มุมมองตาราง
                {viewMode === "table" && (
                  <span className="ml-auto text-xs text-green-500">●</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center — actions (desktop) */}
        <div className="hidden justify-center md:flex">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            {canEdit && onAddNode && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={onAddNode}
                      className="h-7 gap-1.5 rounded-md bg-linear-to-r from-green-600 to-emerald-500 px-3 text-xs shadow-sm"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>เพิ่มคน</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>เพิ่มคนใหม่</TooltipContent>
                </Tooltip>

                <div className="mx-0.5 h-4 w-px bg-border" />
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  onClick={onSearch}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ค้นหา (Ctrl+K)</TooltipContent>
            </Tooltip>

            {viewMode === "graph" && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md"
                      onClick={onAutoLayout}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>จัดเรียงอัตโนมัติ</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md"
                      onClick={onToggleDirection}
                    >
                      {direction === "TB" ? (
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownUp className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {direction === "TB"
                      ? "เปลี่ยนเป็นแนวนอน"
                      : "เปลี่ยนเป็นแนวตั้ง"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md"
                      onClick={handleFitView}
                    >
                      <Maximize className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>พอดีจอ</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Right — share + view mode toggle (desktop) */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          {onShare && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>แชร์</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>แชร์สายรหัส</TooltipContent>
            </Tooltip>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "graph" ? "default" : "ghost"}
                  size="icon"
                  className={`h-7 w-7 cursor-pointer rounded-md ${
                    viewMode === "graph"
                      ? "bg-background shadow-sm hover:bg-background"
                      : ""
                  }`}
                  onClick={() => onViewModeChange?.("graph")}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>มุมมองกราฟ</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="icon"
                  className={`h-7 w-7 cursor-pointer rounded-md ${
                    viewMode === "table"
                      ? "bg-background shadow-sm hover:bg-background"
                      : ""
                  }`}
                  onClick={() => onViewModeChange?.("table")}
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>มุมมองตาราง</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}