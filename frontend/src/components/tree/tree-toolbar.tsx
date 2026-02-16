"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  List,
  BarChart3,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useReactFlow } from "@xyflow/react";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/tree/tree-utils";

interface TreeToolbarProps {
  treeName: string;
  nodeCount: number;
  onAddNode: () => void;
  onAutoLayout?: () => void;
  onSearch?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  allNodes?: TreeNodeData[];
  onSearchSelect?: (node: TreeNodeData) => void;
}

export default function TreeToolbar({
  treeName,
  nodeCount,
  onAddNode,
  onAutoLayout,
  onSearch,
  searchQuery = "",
  onSearchChange,
  allNodes = [],
  onSearchSelect,
}: TreeToolbarProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleFitView = () => {
    fitView({ padding: 0.3, maxZoom: 1.2, duration: 500 });
  };

  // Search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allNodes.filter(
      (n) =>
        n.nickname.toLowerCase().includes(q) ||
        n.firstName?.toLowerCase().includes(q) ||
        n.lastName?.toLowerCase().includes(q) ||
        n.studentId?.toLowerCase().includes(q)
    );
  }, [searchQuery, allNodes]);

  const handleSelectSearchResult = (node: TreeNodeData) => {
    onSearchSelect?.(node);
    onSearchChange?.("");
    setIsSearchOpen(false);

    const flowNode = getNode(node.id);
    if (flowNode) {
      const x = flowNode.position.x + (flowNode.measured?.width ?? 200) / 2;
      const y = flowNode.position.y + (flowNode.measured?.height ?? 100) / 2;
      setCenter(x, y, { zoom: 1.2, duration: 600 });
    }
  };

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const openSearch = useCallback(() => {
    if (onSearch) {
      onSearch();
    } else {
      setIsSearchOpen(true);
    }
  }, [onSearch]);

  // Ctrl+F / Cmd+F shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        onSearchChange?.("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, onSearchChange, openSearch]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-14 items-center justify-between border-b bg-white px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/trees">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-bold">{treeName}</h1>
            <p className="text-xs text-muted-foreground">{nodeCount} คน</p>
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-1">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleFitView}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>พอดีจอ</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-2 h-6" />

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

        {/* Right — Search */}
        <div className="relative flex items-center gap-2">
          {isSearchOpen ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={searchInputRef}
                className="h-8 w-56 pl-8 pr-8 text-sm"
                placeholder="ค้นหาสมาชิก... (Esc ปิด)"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setIsSearchOpen(false);
                  onSearchChange?.("");
                }}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Search Results Dropdown */}
              {searchQuery.trim() && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border bg-white shadow-lg">
                  {filteredNodes.length === 0 ? (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      ไม่พบผลลัพธ์
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto py-1">
                      {filteredNodes.slice(0, 10).map((node) => (
                        <button
                          key={node.id}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => handleSelectSearchResult(node)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className="text-[10px] text-white"
                              style={{
                                backgroundColor: getGenerationColor(
                                  node.generation
                                ),
                              }}
                            >
                              {getInitials(node.nickname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {node.nickname}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {node.firstName} {node.lastName}
                              {node.studentId && ` · ${node.studentId}`}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            รุ่น {node.generation}
                          </span>
                        </button>
                      ))}
                      {filteredNodes.length > 10 && (
                        <div className="border-t px-3 py-2 text-center text-xs text-muted-foreground">
                          แสดง 10 จาก {filteredNodes.length} ผลลัพธ์
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={openSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ค้นหาสมาชิก (Ctrl+F)</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}