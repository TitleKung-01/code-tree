"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials } from "@/lib/tree/tree-utils";
import { Search, X } from "lucide-react";

interface TreeSearchProps {
  nodes: TreeNodeData[];
  open: boolean;
  onClose: () => void;
  onSelect: (node: TreeNodeData) => void;
}

export default function TreeSearch({
  nodes,
  open,
  onClose,
  onSelect,
}: TreeSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input เมื่อเปิด
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setQuery("");   
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Filter nodes
  const filtered = useMemo(
    () =>
      query.trim()
        ? nodes.filter((n) => {
            const q = query.toLowerCase();
            return (
              n.nickname.toLowerCase().includes(q) ||
              n.firstName.toLowerCase().includes(q) ||
              n.lastName.toLowerCase().includes(q) ||
              n.studentId.toLowerCase().includes(q)
            );
          })
        : [],
    [query, nodes]
  );

  // Handle select
  const handleSelect = useCallback(
    (node: TreeNodeData) => {
      onSelect(node);
      onClose();
    },
    [onSelect, onClose]
  );

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Enter" && filtered.length === 1) {
        handleSelect(filtered[0]);
      }
    },
    [onClose, filtered, handleSelect]
  );

  if (!open) return null;

  return (
    <div className="absolute left-1/2 top-20 z-50 w-[400px] -translate-x-1/2">
      <div className="rounded-xl border bg-white shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัสนักศึกษา..."
            className="border-0 focus-visible:ring-0"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {query.trim() === "" ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              พิมพ์เพื่อค้นหาสมาชิกในสายรหัส
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((node) => (
              <button
                key={node.id}
                onClick={() => handleSelect(node)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className="text-xs text-white"
                    style={{
                      backgroundColor: getGenerationColor(node.generation),
                    }}
                  >
                    {getInitials(node.nickname)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {node.nickname}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {node.firstName} {node.lastName}
                    {node.studentId && ` · ${node.studentId}`}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px]"
                  style={{
                    backgroundColor: `${getGenerationColor(node.generation)}20`,
                    color: getGenerationColor(node.generation),
                  }}
                >
                  รุ่น {node.generation}
                </Badge>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length > 0
              ? `พบ ${filtered.length} คน`
              : "กด ESC เพื่อปิด"}
          </p>
        </div>
      </div>
    </div>
  );
}