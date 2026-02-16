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
} from "lucide-react";
import Link from "next/link";
import { useReactFlow } from "@xyflow/react";
import type { LayoutDirection } from "@/lib/tree/layout-engine";
import { motion } from "framer-motion";

export type ViewMode = "graph" | "table";

interface TreeToolbarProps {
  treeName: string;
  nodeCount: number;
  direction: LayoutDirection;
  viewMode: ViewMode;
  onAddNode: () => void;
  onAutoLayout?: () => void;
  onSearch?: () => void;
  onToggleDirection?: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
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
}: TreeToolbarProps) {
  const { fitView } = useReactFlow();

  const handleFitView = () => {
    fitView({ padding: 0.3, maxZoom: 1.2, duration: 500 });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className="grid h-12 grid-cols-3 items-center border-b bg-background/80 px-3 backdrop-blur-md"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Left */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/trees">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>กลับหน้ารายการ</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{treeName}</h1>
            <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] font-medium">
              <Users className="h-2.5 w-2.5" />
              {nodeCount}
            </Badge>
          </div>
        </div>

        {/* Center — actions */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onAddNode}
                  className="h-7 gap-1.5 rounded-md bg-linear-to-r from-green-600 to-emerald-500 px-3 text-xs shadow-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">เพิ่มคน</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>เพิ่มคนใหม่</TooltipContent>
            </Tooltip>

            <div className="mx-0.5 h-4 w-px bg-border" />

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

        {/* Right — view mode toggle */}
        <div className="flex justify-end">
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