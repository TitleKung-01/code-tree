"use client";

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
  ZoomIn,
  ZoomOut,
  Maximize,
  List,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface TreeToolbarProps {
  treeName: string;
  nodeCount: number;
  onAddNode: () => void;
  onAutoLayout?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
}

export default function TreeToolbar({
  treeName,
  nodeCount,
  onAddNode,
  onAutoLayout,
}: TreeToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-14 items-center justify-between border-b bg-white px-4">
        {/* Left: Back + Tree Name */}
        <div className="flex items-center gap-3">
          <Link href="/trees">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-sm font-bold">{treeName}</h1>
            <p className="text-xs text-muted-foreground">
              {nodeCount} คน
            </p>
          </div>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-1">
          {/* เพิ่มคน */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onAddNode} className="gap-1">
                <UserPlus className="h-4 w-4" />
                เพิ่มคน
              </Button>
            </TooltipTrigger>
            <TooltipContent>เพิ่มคนใหม่ลงในสายรหัส</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Auto Layout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={onAutoLayout}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>จัดเรียงอัตโนมัติ</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Zoom (placeholder — React Flow Controls จัดการให้) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ใช้ scroll wheel หรือปุ่มมุมซ้ายล่าง</TooltipContent>
          </Tooltip>

          {/* Placeholder buttons (Day 10+) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List View (เร็วๆ นี้)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>สถิติ (เร็วๆ นี้)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ตั้งค่า (เร็วๆ นี้)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}