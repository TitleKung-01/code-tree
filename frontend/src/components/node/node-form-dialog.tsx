"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/tree/tree-utils";
import {
  User,
  Hash,
  Users,
  Crown,
  GraduationCap,
  CircleDot,
  UserCheck,
  Loader2,
  Pencil,
  UserPlus,
  ChevronDown,
  Camera,
  Phone,
  Mail,
  MessageCircle,
  Search,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "profile" | "tree" | "contact";

interface NodeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nickname: string;
    firstName: string;
    lastName: string;
    studentId: string;
    parentIds: string[];
    status: string;
    generation: number;
    photoUrl: string;
    phone: string;
    email: string;
    lineId: string;
    discord: string;
    facebook: string;
  }) => void;
  allNodes: TreeNodeData[];
  defaultParentId?: string | null;
  loading?: boolean;
  editNode?: TreeNodeData | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "ข้อมูลส่วนตัว", icon: User },
  { id: "tree", label: "สายรหัส", icon: Users },
  { id: "contact", label: "ติดต่อ", icon: Phone },
];

const STATUS_OPTIONS = [
  {
    value: "studying",
    label: "กำลังศึกษา",
    icon: CircleDot,
    dotColor: "bg-emerald-500",
    ringColor: "ring-emerald-200 dark:ring-emerald-800/60",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-400 dark:border-emerald-600",
  },
  {
    value: "graduated",
    label: "จบแล้ว",
    icon: GraduationCap,
    dotColor: "bg-blue-500",
    ringColor: "ring-blue-200 dark:ring-blue-800/60",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-400 dark:border-blue-600",
  },
  {
    value: "retired",
    label: "พ้นสภาพ",
    icon: UserCheck,
    dotColor: "bg-gray-400",
    ringColor: "ring-gray-200 dark:ring-gray-700/60",
    bgColor: "bg-gray-50 dark:bg-gray-800/40",
    textColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-gray-300 dark:border-gray-600",
  },
] as const;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── Icon Input Wrapper ──────────────────────────────────────────────────────

function IconInput({
  icon: Icon,
  svgIcon: SvgIcon,
  ...inputProps
}: {
  icon?: React.ElementType;
  svgIcon?: React.ElementType;
} & React.ComponentProps<typeof Input>) {
  const IconComp = Icon || SvgIcon;
  return (
    <div className="relative">
      {IconComp && (
        <IconComp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      )}
      <Input {...inputProps} className={`${IconComp ? "pl-10" : ""} ${inputProps.className ?? ""}`} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NodeFormDialog({
  open,
  onClose,
  onSubmit,
  allNodes,
  defaultParentId = null,
  loading = false,
  editNode = null,
}: NodeFormDialogProps) {
  // ── Form State ──
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [parentIds, setParentIds] = useState<string[]>([]);
  const [status, setStatus] = useState("studying");
  const [generation, setGeneration] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [discord, setDiscord] = useState("");
  const [facebook, setFacebook] = useState("");

  // ── UI State ──
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState("");

  const isEdit = !!editNode;
  const genColor = getGenerationColor(generation || 1);
  const accentColor = isEdit
    ? getGenerationColor(editNode?.generation ?? 1)
    : genColor;

  // ── Reset on open ──
  useEffect(() => {
    if (!open) return;

    if (editNode) {
      setTimeout(() => {
        setActiveTab("profile");
        setParentPickerOpen(false);
        setParentSearch("");
        setNickname(editNode.nickname || "");
        setFirstName(editNode.firstName || "");
        setLastName(editNode.lastName || "");
        setStudentId(editNode.studentId || "");
        setParentIds(editNode.parentIds || []);
        setStatus(editNode.status || "studying");
        setGeneration(editNode.generation || 0);
        setPhotoUrl(editNode.photoUrl || "");
        setPhone(editNode.phone || "");
        setEmail(editNode.email || "");
        setLineId(editNode.lineId || "");
        setDiscord(editNode.discord || "");
        setFacebook(editNode.facebook || "");
      }, 0);
    } else {
      setTimeout(() => {
        setActiveTab("profile");
        setParentPickerOpen(false);
        setParentSearch("");
        setNickname("");
        setFirstName("");
        setLastName("");
        setStudentId("");
        const initialParents = defaultParentId ? [defaultParentId] : [];
        setParentIds(initialParents);
        setStatus("studying");
        const defaultParent = allNodes.find((n) => n.id === defaultParentId);
        setGeneration(defaultParent ? defaultParent.generation + 1 : 0);
        setPhotoUrl("");
        setPhone("");
        setEmail("");
        setLineId("");
        setDiscord("");
        setFacebook("");
      }, 0);
    }
  }, [open, editNode, defaultParentId, allNodes]);

  // ── Handlers ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nickname,
      firstName,
      lastName,
      studentId,
      parentIds,
      status,
      generation,
      photoUrl,
      phone,
      email,
      lineId,
      discord,
      facebook,
    });
  };

  const selectedParents = allNodes.filter((n) => parentIds.includes(n.id));

  const handleToggleParent = (nodeId: string) => {
    setParentIds((prev) => {
      const next = prev.includes(nodeId)
        ? prev.filter((id) => id !== nodeId)
        : [...prev, nodeId];

      if (!isEdit && next.length > 0) {
        const first = allNodes.find((n) => n.id === next[0]);
        if (first) setGeneration(first.generation + 1);
      } else if (!isEdit && next.length === 0) {
        setGeneration(0);
      }
      return next;
    });
  };

  const nodesByGeneration = useMemo(() => {
    const grouped = new Map<number, TreeNodeData[]>();
    const query = parentSearch.trim().toLowerCase();
    allNodes.forEach((n) => {
      if (
        query &&
        !n.nickname.toLowerCase().includes(query) &&
        !(n.studentId && n.studentId.toLowerCase().includes(query))
      ) {
        return;
      }
      const list = grouped.get(n.generation) || [];
      list.push(n);
      grouped.set(n.generation, list);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [allNodes, parentSearch]);

  const contactCount = [phone, email, lineId, discord, facebook].filter(
    Boolean
  ).length;

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[440px]">
        {/* ━━ Accent bar ━━ */}
        <div
          className="h-1.5 shrink-0 rounded-t-lg transition-colors duration-500"
          style={{ backgroundColor: accentColor }}
        />

        {/* ━━ Header: Avatar + Title ━━ */}
        <div className="flex shrink-0 flex-col items-center gap-3 px-6 pt-5 pb-3">
          <div className="relative">
            <div
              className="rounded-full p-[3px] shadow-lg transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}55)`,
              }}
            >
              <Avatar className="h-16 w-16 border-[3px] border-background">
                {photoUrl && <AvatarImage src={photoUrl} alt={nickname} />}
                <AvatarFallback
                  className="text-xl font-bold text-white transition-colors duration-500"
                  style={{ backgroundColor: accentColor }}
                >
                  {nickname.trim() ? getInitials(nickname) : "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            <Badge
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 gap-0.5 border-2 border-background px-1.5 py-0 text-[10px] font-semibold text-white shadow transition-colors duration-500"
              style={{ backgroundColor: accentColor }}
            >
              <Crown className="h-2.5 w-2.5" />
              รุ่น {generation}
            </Badge>
          </div>

          <DialogHeader className="items-center gap-0.5 text-center">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              {isEdit ? (
                <Pencil className="h-4 w-4 text-muted-foreground" />
              ) : (
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              )}
              {isEdit ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEdit
                ? `กำลังแก้ไขข้อมูลของ ${editNode?.nickname}`
                : "กรอกข้อมูลสมาชิกใหม่ลงในสายรหัส"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ━━ Tab Navigation ━━ */}
        <div className="flex shrink-0 border-b px-4">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.id === "contact" && contactCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[9px] font-bold leading-none">
                    {contactCount}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-[2px] rounded-full transition-colors duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ━━ Form ━━ */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              {/* ── Tab: ข้อมูลส่วนตัว ── */}
              {activeTab === "profile" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="nickname" className="text-sm font-medium">
                      ชื่อเล่น <span className="text-destructive">*</span>
                    </Label>
                    <IconInput
                      icon={User}
                      id="nickname"
                      placeholder="เช่น เจมส์, มิ้นท์, บีม"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        ชื่อจริง
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="ชื่อจริง"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        นามสกุล
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="นามสกุล"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="studentId" className="text-sm font-medium">
                      รหัสนักศึกษา
                    </Label>
                    <IconInput
                      icon={Hash}
                      id="studentId"
                      placeholder="เช่น 6401001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="photoUrl" className="text-sm font-medium">
                      รูปโปรไฟล์ (URL)
                    </Label>
                    <IconInput
                      icon={Camera}
                      id="photoUrl"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      type="url"
                    />
                  </div>
                </>
              )}

              {/* ── Tab: สายรหัส ── */}
              {activeTab === "tree" && (
                <>
                  {/* Generation */}
                  <div className="space-y-1.5">
                    <Label htmlFor="generation" className="text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        รุ่น
                        <span className="text-destructive">*</span>
                        {!isEdit && parentIds.length > 0 && (
                          <span className="text-[10px] font-normal text-muted-foreground">
                            (คำนวณจากพี่รหัสอัตโนมัติ)
                          </span>
                        )}
                      </span>
                    </Label>
                    <IconInput
                      icon={Crown}
                      id="generation"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={generation}
                      onChange={(e) =>
                        setGeneration(parseInt(e.target.value) || 0)
                      }
                      readOnly={!isEdit && parentIds.length > 0}
                      className={
                        !isEdit && parentIds.length > 0
                          ? "bg-muted/50 text-muted-foreground"
                          : ""
                      }
                    />
                  </div>

                  {/* Parent selector (create mode only) */}
                  {!isEdit && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        พี่รหัส
                        {parentIds.length > 0 && (
                          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                            ({parentIds.length} คน)
                          </span>
                        )}
                      </Label>

                      {/* Selected parents as chips */}
                      {selectedParents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedParents.map((p) => (
                            <Badge
                              key={p.id}
                              variant="secondary"
                              className="gap-1.5 py-1 pr-1 text-xs"
                            >
                              <Avatar className="h-4 w-4">
                                <AvatarFallback
                                  className="text-[7px] font-bold text-white"
                                  style={{
                                    backgroundColor: getGenerationColor(
                                      p.generation
                                    ),
                                  }}
                                >
                                  {getInitials(p.nickname)}
                                </AvatarFallback>
                              </Avatar>
                              {p.nickname}
                              <button
                                type="button"
                                onClick={() => handleToggleParent(p.id)}
                                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Dropdown trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setParentPickerOpen((prev) => !prev);
                          if (parentPickerOpen) setParentSearch("");
                        }}
                        className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="text-muted-foreground">
                          {parentPickerOpen
                            ? "ปิดรายชื่อ"
                            : "เลือกพี่รหัส..."}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            parentPickerOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Inline expandable parent list */}
                      {parentPickerOpen && (
                        <div className="overflow-hidden rounded-lg border bg-muted/20">
                          {/* Search bar */}
                          <div className="flex items-center gap-2 border-b bg-background px-3 py-2">
                            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="ค้นหาชื่อหรือรหัส..."
                              value={parentSearch}
                              onChange={(e) => setParentSearch(e.target.value)}
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              autoFocus
                            />
                            {parentSearch && (
                              <button
                                type="button"
                                onClick={() => setParentSearch("")}
                                className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                ล้าง
                              </button>
                            )}
                          </div>

                          {/* Node list */}
                          <div className="max-h-52 overflow-y-auto overscroll-contain">
                            <div className="p-1.5">
                              {nodesByGeneration.length === 0 && (
                                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                                  {parentSearch
                                    ? "ไม่พบผลลัพธ์"
                                    : "ยังไม่มีสมาชิกในต้นนี้"}
                                </p>
                              )}
                              {nodesByGeneration.map(([gen, nodes]) => (
                                <div key={gen} className="mb-1 last:mb-0">
                                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    <span
                                      className="inline-block h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor:
                                          getGenerationColor(gen),
                                      }}
                                    />
                                    รุ่นที่ {gen}
                                  </div>
                                  {nodes.map((n) => {
                                    const isChecked = parentIds.includes(n.id);
                                    return (
                                      <label
                                        key={n.id}
                                        className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-background ${
                                          isChecked
                                            ? "bg-background shadow-sm"
                                            : ""
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={() =>
                                            handleToggleParent(n.id)
                                          }
                                        />
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback
                                            className="text-[10px] font-semibold text-white"
                                            style={{
                                              backgroundColor:
                                                getGenerationColor(
                                                  n.generation
                                                ),
                                            }}
                                          >
                                            {getInitials(n.nickname)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">
                                          {n.nickname}
                                        </span>
                                        {n.studentId && (
                                          <span className="text-xs text-muted-foreground">
                                            {n.studentId}
                                          </span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">สถานะ</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = status === opt.value;
                        const OptIcon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(opt.value)}
                            className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3.5 text-center transition-all duration-200 ${
                              isActive
                                ? `${opt.bgColor} ${opt.textColor} ${opt.borderColor} ring-4 ${opt.ringColor}`
                                : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            <OptIcon
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isActive
                                  ? "scale-110"
                                  : "opacity-50 group-hover:opacity-70"
                              }`}
                            />
                            <span className="text-[11px] font-semibold leading-tight">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── Tab: ช่องทางติดต่อ ── */}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    กรอกช่องทางติดต่อเพื่อให้สมาชิกในสายรหัสติดต่อกันได้ (ไม่บังคับ)
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        เบอร์โทรศัพท์
                      </Label>
                      <IconInput
                        icon={Phone}
                        id="phone"
                        placeholder="08x-xxx-xxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">
                        อีเมล
                      </Label>
                      <IconInput
                        icon={Mail}
                        id="email"
                        placeholder="name@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lineId" className="text-sm font-medium">
                        LINE ID
                      </Label>
                      <IconInput
                        icon={MessageCircle}
                        id="lineId"
                        placeholder="@lineid"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="discord" className="text-sm font-medium">
                        Discord
                      </Label>
                      <IconInput
                        svgIcon={DiscordIcon}
                        id="discord"
                        placeholder="username#1234"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="facebook" className="text-sm font-medium">
                        Facebook
                      </Label>
                      <IconInput
                        svgIcon={FacebookIcon}
                        id="facebook"
                        placeholder="ชื่อ Facebook หรือ URL"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ━━ Footer ━━ */}
          <div className="flex shrink-0 items-center justify-between border-t bg-muted/10 px-6 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !nickname.trim()}
              className="min-w-[110px] gap-1.5 text-white shadow-md transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor:
                  !loading && nickname.trim() ? accentColor : undefined,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : isEdit ? (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  บันทึก
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  เพิ่มสมาชิก
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
