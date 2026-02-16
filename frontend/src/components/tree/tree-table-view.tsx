"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import {
  getInitials,
  getStatusLabel,
  getStatusColor,
  findParents,
  findChildren,
} from "@/lib/tree/tree-utils";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  CircleDot,
  GraduationCap,
  UserCheck,
  Crown,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export interface CsvImportRow {
  nickname: string;
  firstName: string;
  lastName: string;
  studentId: string;
  status: string;
  parentNickname: string;
}

interface TreeTableViewProps {
  nodes: TreeNodeData[];
  allNodes: TreeNodeData[];
  onNodeClick?: (node: TreeNodeData) => void;
  onEdit?: (node: TreeNodeData) => void;
  onDelete?: (node: TreeNodeData) => void;
  onAddChild?: (node: TreeNodeData) => void;
  onImportCsv?: (rows: CsvImportRow[]) => Promise<void>;
  importing?: boolean;
}

type SortField = "nickname" | "generation" | "studentId" | "status" | "children";
type SortDir = "asc" | "desc";

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

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

const CSV_HEADERS = [
  "nickname",
  "firstName",
  "lastName",
  "studentId",
  "status",
  "parentNickname",
] as const;

const STATUS_VALUES = ["studying", "graduated", "retired"];

export default function TreeTableView({
  nodes,
  allNodes,
  onNodeClick,
  onEdit,
  onDelete,
  onAddChild,
  onImportCsv,
  importing,
}: TreeTableViewProps) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("generation");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterGen, setFilterGen] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<CsvImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generations = useMemo(
    () => [...new Set(nodes.map((n) => n.generation))].sort(),
    [nodes]
  );

  const filtered = useMemo(() => {
    let result = [...nodes];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.nickname.toLowerCase().includes(q) ||
          n.firstName.toLowerCase().includes(q) ||
          n.lastName.toLowerCase().includes(q) ||
          n.studentId.toLowerCase().includes(q)
      );
    }

    if (filterGen !== "all") {
      result = result.filter((n) => n.generation === Number(filterGen));
    }

    if (filterStatus !== "all") {
      result = result.filter((n) => n.status === filterStatus);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nickname":
          cmp = a.nickname.localeCompare(b.nickname, "th");
          break;
        case "generation":
          cmp = a.generation - b.generation;
          break;
        case "studentId":
          cmp = (a.studentId || "").localeCompare(b.studentId || "");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "children":
          cmp =
            findChildren(allNodes, a.id).length -
            findChildren(allNodes, b.id).length;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [nodes, allNodes, query, filterGen, filterStatus, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-foreground" />
    ) : (
      <ChevronDown className="h-3 w-3 text-foreground" />
    );
  };

  // Stats
  const statsByGen = useMemo(() => {
    const map = new Map<number, number>();
    nodes.forEach((n) => map.set(n.generation, (map.get(n.generation) || 0) + 1));
    return map;
  }, [nodes]);

  const statsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach((n) => map.set(n.status, (map.get(n.status) || 0) + 1));
    return map;
  }, [nodes]);

  // ========== CSV Export ==========
  const handleExportCsv = useCallback(() => {
    const headerLine = [
      "nickname",
      "firstName",
      "lastName",
      "studentId",
      "status",
      "generation",
      "parentNicknames",
    ].join(",");

    const rows = nodes.map((node) => {
      const parents = findParents(allNodes, node);
      const parentNames = parents.map((p) => p.nickname).join("; ");
      return [
        escapeCsvField(node.nickname),
        escapeCsvField(node.firstName),
        escapeCsvField(node.lastName),
        escapeCsvField(node.studentId),
        escapeCsvField(node.status),
        String(node.generation),
        escapeCsvField(parentNames),
      ].join(",");
    });

    const bom = "\uFEFF";
    const csv = bom + [headerLine, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tree-members-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`ส่งออก ${nodes.length} รายการเป็น CSV สำเร็จ`);
  }, [nodes, allNodes]);

  // ========== CSV Import ==========
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;

        const lines = text
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .filter((l) => l.trim());
        if (lines.length < 2) {
          setImportErrors(["ไฟล์ CSV ต้องมีอย่างน้อย 1 แถวข้อมูล (ไม่รวมหัวตาราง)"]);
          setImportPreview([]);
          setImportDialogOpen(true);
          return;
        }

        const headerFields = parseCsvLine(lines[0]).map((h) =>
          h.toLowerCase().trim()
        );

        const nicknameIdx = headerFields.indexOf("nickname");
        if (nicknameIdx === -1) {
          setImportErrors(["ไม่พบคอลัมน์ 'nickname' ในหัวตาราง"]);
          setImportPreview([]);
          setImportDialogOpen(true);
          return;
        }

        const firstNameIdx = headerFields.indexOf("firstname");
        const lastNameIdx = headerFields.indexOf("lastname");
        const studentIdIdx = headerFields.indexOf("studentid");
        const statusIdx = headerFields.indexOf("status");
        const parentIdx =
          headerFields.indexOf("parentnickname") !== -1
            ? headerFields.indexOf("parentnickname")
            : headerFields.indexOf("parentnicknames");

        const errors: string[] = [];
        const rows: CsvImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCsvLine(lines[i]);
          const nickname = fields[nicknameIdx]?.trim() || "";

          if (!nickname) {
            errors.push(`แถว ${i + 1}: ไม่มีชื่อเล่น (nickname)`);
            continue;
          }

          const status = statusIdx !== -1 ? fields[statusIdx]?.trim().toLowerCase() || "studying" : "studying";
          if (!STATUS_VALUES.includes(status)) {
            errors.push(
              `แถว ${i + 1}: สถานะ "${status}" ไม่ถูกต้อง (ต้องเป็น studying, graduated, retired)`
            );
          }

          rows.push({
            nickname,
            firstName: firstNameIdx !== -1 ? fields[firstNameIdx]?.trim() || "" : "",
            lastName: lastNameIdx !== -1 ? fields[lastNameIdx]?.trim() || "" : "",
            studentId: studentIdIdx !== -1 ? fields[studentIdIdx]?.trim() || "" : "",
            status: STATUS_VALUES.includes(status) ? status : "studying",
            parentNickname: parentIdx !== -1 ? fields[parentIdx]?.trim() || "" : "",
          });
        }

        setImportPreview(rows);
        setImportErrors(errors);
        setImportDialogOpen(true);
      };
      reader.readAsText(file, "UTF-8");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const handleConfirmImport = useCallback(async () => {
    if (!onImportCsv || importPreview.length === 0) return;
    await onImportCsv(importPreview);
    setImportDialogOpen(false);
    setImportPreview([]);
    setImportErrors([]);
  }, [onImportCsv, importPreview]);

  const handleDownloadTemplate = useCallback(() => {
    const bom = "\uFEFF";
    const header = CSV_HEADERS.join(",");
    const example = "ก้อง,สมชาย,ใจดี,65000001,studying,";
    const csv = bom + [header, example].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "import-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="flex h-full flex-col bg-muted/10">
      {/* Stats Bar */}
      <div className="border-b bg-background px-6 py-3 lg:px-10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Generation chips */}
          {generations.map((gen) => {
            const color = getGenerationColor(gen);
            const count = statsByGen.get(gen) || 0;
            const isActive = filterGen === String(gen);
            return (
              <button
                key={gen}
                onClick={() =>
                  setFilterGen(isActive ? "all" : String(gen))
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "border-current shadow-sm"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
                style={isActive ? { color, borderColor: color, backgroundColor: `${color}10` } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                รุ่น {gen}
                <span className="font-normal text-muted-foreground">
                  {count}
                </span>
              </button>
            );
          })}

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Status chips */}
          {(["studying", "graduated", "retired"] as const).map((status) => {
            const count = statsByStatus.get(status) || 0;
            if (count === 0) return null;
            const isActive = filterStatus === status;
            const statusClasses = getStatusColor(status);
            return (
              <button
                key={status}
                onClick={() =>
                  setFilterStatus(isActive ? "all" : status)
                }
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? `${statusClasses} border-current shadow-sm`
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {getStatusIcon(status)}
                {getStatusLabel(status)}
                <span className="font-normal text-muted-foreground">
                  {count}
                </span>
              </button>
            );
          })}

          {(filterGen !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => {
                setFilterGen("all");
                setFilterStatus("all");
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Search bar + CSV actions */}
      <div className="border-b bg-background px-6 py-2 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, รหัสนักศึกษา..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 bg-muted/30 pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleExportCsv}
                    disabled={nodes.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" />
                    ส่งออก CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ส่งออกข้อมูลทั้งหมดเป็นไฟล์ CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    นำเข้า CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>นำเข้าข้อมูลจากไฟล์ CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 py-3 lg:px-8">
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/30">
            <tr className="border-b text-left text-xs font-medium text-muted-foreground">
              <th className="w-[280px] px-4 py-2.5">
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("nickname")}
                >
                  สมาชิก
                  {renderSortIcon("nickname")}
                </button>
              </th>
              <th className="w-[100px] px-3 py-2.5">
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("generation")}
                >
                  รุ่น
                  {renderSortIcon("generation")}
                </button>
              </th>
              <th className="w-[140px] px-3 py-2.5">
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("studentId")}
                >
                  รหัส
                  {renderSortIcon("studentId")}
                </button>
              </th>
              <th className="w-[120px] px-3 py-2.5">
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("status")}
                >
                  สถานะ
                  {renderSortIcon("status")}
                </button>
              </th>
              <th className="px-3 py-2.5">พี่รหัส</th>
              <th className="w-[80px] px-3 py-2.5">
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => handleSort("children")}
                >
                  น้อง
                  {renderSortIcon("children")}
                </button>
              </th>
              <th className="w-[120px] px-3 py-2.5 text-right">
                จัดการ
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {query.trim()
                        ? `ไม่พบผลลัพธ์สำหรับ "${query}"`
                        : "ไม่มีข้อมูล"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((node) => {
                const genColor = getGenerationColor(node.generation);
                const statusClasses = getStatusColor(node.status);
                const parents = findParents(allNodes, node);
                const children = findChildren(allNodes, node.id);

                return (
                  <tr
                    key={node.id}
                    className="group border-b transition-colors last:border-b-0 hover:bg-accent/50"
                  >
                    {/* สมาชิก */}
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onNodeClick?.(node)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="relative">
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
                              {getInitials(node.nickname, node.firstName)}
                            </AvatarFallback>
                          </Avatar>
                          {node.parentIds.length === 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-white">
                              <Crown className="h-2 w-2" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold hover:underline">
                            {node.nickname}
                          </p>
                          {(node.firstName || node.lastName) && (
                            <p className="text-xs text-muted-foreground">
                              {node.firstName} {node.lastName}
                            </p>
                          )}
                        </div>
                      </button>
                    </td>

                    {/* รุ่น */}
                    <td className="px-3 py-2.5">
                      <Badge
                        className="gap-0.5 text-[10px] text-white"
                        style={{ backgroundColor: genColor }}
                      >
                        รุ่น {node.generation}
                      </Badge>
                    </td>

                    {/* รหัส */}
                    <td className="px-3 py-2.5">
                      {node.studentId ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {node.studentId}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </td>

                    {/* สถานะ */}
                    <td className="px-3 py-2.5">
                      <Badge
                        variant="secondary"
                        className={`gap-1 text-[10px] ${statusClasses}`}
                      >
                        {getStatusIcon(node.status)}
                        {getStatusLabel(node.status)}
                      </Badge>
                    </td>

                    {/* พี่รหัส */}
                    <td className="px-3 py-2.5">
                      {parents.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {parents.slice(0, 3).map((p) => (
                            <TooltipProvider key={p.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => onNodeClick?.(p)}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Avatar className="h-6 w-6 ring-1 ring-background">
                                      <AvatarFallback
                                        className="text-[9px] font-semibold text-white"
                                        style={{
                                          backgroundColor: getGenerationColor(
                                            p.generation
                                          ),
                                        }}
                                      >
                                        {getInitials(p.nickname)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {p.nickname} (รุ่น {p.generation})
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          {parents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{parents.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500">
                          Root
                        </span>
                      )}
                    </td>

                    {/* น้อง */}
                    <td className="px-3 py-2.5">
                      {children.length > 0 ? (
                        <span className="text-xs font-medium">
                          {children.length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          0
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onNodeClick?.(node)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ดูข้อมูล</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onAddChild?.(node)}
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>เพิ่มน้อง</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onEdit?.(node)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>แก้ไข</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={() => onDelete?.(node)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ลบ</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-6 py-2 lg:px-10">
        <p className="text-xs text-muted-foreground">
          แสดง {filtered.length} จาก {nodes.length} คน
          {filterGen !== "all" && ` · กรองรุ่น ${filterGen}`}
          {filterStatus !== "all" && ` · ${getStatusLabel(filterStatus)}`}
        </p>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-center">
              นำเข้าจากไฟล์ CSV
            </DialogTitle>
            <DialogDescription className="text-center">
              ตรวจสอบข้อมูลก่อนนำเข้า
            </DialogDescription>
          </DialogHeader>

          {importErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    พบปัญหา {importErrors.length} รายการ
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {importErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {importErrors.length > 5 && (
                      <li>...และอีก {importErrors.length - 5} รายการ</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="max-h-[300px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/60">
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">ชื่อเล่น</th>
                    <th className="px-3 py-2">ชื่อ</th>
                    <th className="px-3 py-2">นามสกุล</th>
                    <th className="px-3 py-2">รหัส</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2">พี่</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-b-0 hover:bg-accent/30"
                    >
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-1.5 font-medium">
                        {row.nickname}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {row.firstName || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {row.lastName || "—"}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                        {row.studentId || "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${getStatusColor(row.status)}`}
                        >
                          {getStatusLabel(row.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">
                        {row.parentNickname || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importPreview.length === 0 && importErrors.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">ไม่พบข้อมูลในไฟล์</p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-3.5 w-3.5" />
              ดาวน์โหลดเทมเพลต
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importPreview.length === 0 || importing}
                className="gap-1.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    นำเข้า {importPreview.length} รายการ
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
