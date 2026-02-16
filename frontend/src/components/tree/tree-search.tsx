"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { getInitials } from "@/lib/tree/tree-utils";
import { Search, X, CornerDownLeft, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setQuery("");
        setSelectedIdx(0);
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

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

  useEffect(() => {
    setTimeout(() => {
      setSelectedIdx(0);
    }, 0);
  }, [filtered]);

  const handleSelect = useCallback(
    (node: TreeNodeData) => {
      onSelect(node);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === "Enter" && filtered.length > 0) {
        handleSelect(filtered[selectedIdx]);
      }
    },
    [onClose, filtered, handleSelect, selectedIdx]
  );

  return (
    <AnimatePresence>
      {open && (
      <>
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <div className="absolute left-1/2 top-16 z-50 w-[420px] -translate-x-1/2">
        <motion.div
          className="overflow-hidden rounded-2xl border bg-background shadow-2xl"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัสนักศึกษา..."
              className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
            />
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
            {query.trim() === "" ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  พิมพ์เพื่อค้นหาสมาชิกในสายรหัส
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;
                </p>
              </div>
            ) : (
              filtered.map((node, idx) => {
                const genColor = getGenerationColor(node.generation);
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${
                      idx === selectedIdx
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-background">
                      {node.photoUrl && (
                        <AvatarImage
                          src={node.photoUrl}
                          alt={node.nickname}
                        />
                      )}
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{ backgroundColor: genColor }}
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
                      className="shrink-0 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${genColor}15`,
                        color: genColor,
                      }}
                    >
                      รุ่น {node.generation}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length > 0
                ? `พบ ${filtered.length} คน`
                : ""}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  <CornerDownLeft className="inline h-2.5 w-2.5" />
                </kbd>
                เลือก
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                  ESC
                </kbd>
                ปิด
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      </>
      )}
    </AnimatePresence>
  );
}