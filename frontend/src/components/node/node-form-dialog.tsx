"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ChevronRight,
} from "lucide-react";

interface NodeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nickname: string;
    firstName: string;
    lastName: string;
    studentId: string;
    parentId: string | null;
    status: string;
  }) => void;
  allNodes: TreeNodeData[];
  defaultParentId?: string | null;
  loading?: boolean;
  editNode?: TreeNodeData | null;
}

const STATUS_OPTIONS = [
  {
    value: "studying",
    label: "กำลังศึกษา",
    icon: CircleDot,
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    value: "graduated",
    label: "จบแล้ว",
    icon: GraduationCap,
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  {
    value: "retired",
    label: "พ้นสภาพ",
    icon: UserCheck,
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-800/30",
    textColor: "text-gray-500 dark:text-gray-400",
  },
] as const;

export default function NodeFormDialog({
  open,
  onClose,
  onSubmit,
  allNodes,
  defaultParentId = null,
  loading = false,
  editNode = null,
}: NodeFormDialogProps) {
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [status, setStatus] = useState("studying");

  const isEdit = !!editNode;

  useEffect(() => {
    if (open) {
      if (editNode) {
        setTimeout(() => {
          setNickname(editNode.nickname || "");
          setFirstName(editNode.firstName || "");
          setLastName(editNode.lastName || "");
          setStudentId(editNode.studentId || "");
          setParentId(editNode.parentIds[0] || "none");
          setStatus(editNode.status || "studying");
        }, 0);
      } else {
        setTimeout(() => {
          setNickname("");
          setFirstName("");
          setLastName("");
          setStudentId("");
          setParentId(defaultParentId || "none");
          setStatus("studying");
        }, 0);
      }
    }
  }, [open, editNode, defaultParentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nickname,
      firstName,
      lastName,
      studentId,
      parentId: parentId === "none" ? null : parentId,
      status,
    });
  };

  const selectedParent = allNodes.find((n) => n.id === parentId);
  const estimatedGeneration = selectedParent
    ? selectedParent.generation + 1
    : 1;
  const genColor = getGenerationColor(estimatedGeneration);

  const nodesByGeneration = useMemo(() => {
    const grouped = new Map<number, TreeNodeData[]>();
    allNodes.forEach((n) => {
      const list = grouped.get(n.generation) || [];
      list.push(n);
      grouped.set(n.generation, list);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [allNodes]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Header with accent */}
        <div className="relative px-6 pt-6 pb-4">
          <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-lg"
            style={{
              backgroundColor: isEdit
                ? getGenerationColor(editNode?.generation ?? 1)
                : genColor,
            }}
          />
          <DialogHeader className="gap-1.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${isEdit ? getGenerationColor(editNode?.generation ?? 1) : genColor}18`,
                  color: isEdit
                    ? getGenerationColor(editNode?.generation ?? 1)
                    : genColor,
                }}
              >
                {isEdit ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base">
                  {isEdit ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isEdit
                    ? `กำลังแก้ไขข้อมูลของ ${editNode?.nickname}`
                    : "กรอกข้อมูลสมาชิกใหม่ลงในสายรหัส"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 pb-2">
            {/* Live Avatar Preview */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full p-0.5 transition-colors duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${isEdit ? getGenerationColor(editNode?.generation ?? 1) : genColor}, ${isEdit ? getGenerationColor(editNode?.generation ?? 1) : genColor}88)`,
                  }}
                >
                  <Avatar className="h-16 w-16 border-2 border-background">
                    {editNode?.photoUrl && (
                      <AvatarImage
                        src={editNode.photoUrl}
                        alt={nickname}
                      />
                    )}
                    <AvatarFallback
                      className="text-xl font-bold text-white transition-colors duration-300"
                      style={{
                        backgroundColor: isEdit
                          ? getGenerationColor(editNode?.generation ?? 1)
                          : genColor,
                      }}
                    >
                      {nickname.trim()
                        ? getInitials(nickname)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {!isEdit && (
                  <Badge
                    className="gap-1 text-white transition-colors duration-300"
                    style={{ backgroundColor: genColor }}
                  >
                    <Crown className="h-3 w-3" />
                    รุ่นที่ {estimatedGeneration}
                  </Badge>
                )}
              </div>
            </div>

            {/* Section: ข้อมูลส่วนตัว */}
            <fieldset className="space-y-3">
              <legend className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="h-3 w-3" />
                ข้อมูลส่วนตัว
              </legend>

              <div className="space-y-1.5">
                <Label htmlFor="nickname" className="text-sm">
                  ชื่อเล่น <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nickname"
                  placeholder="เช่น เจมส์, มิ้นท์, บีม"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  autoFocus
                  className="transition-shadow focus-visible:ring-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm">
                    ชื่อจริง
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="ชื่อจริง"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="transition-shadow focus-visible:ring-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm">
                    นามสกุล
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="transition-shadow focus-visible:ring-2"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    รหัสนักศึกษา
                  </span>
                </Label>
                <Input
                  id="studentId"
                  placeholder="เช่น 6401001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="transition-shadow focus-visible:ring-2"
                />
              </div>
            </fieldset>

            {/* Section: ข้อมูลสายรหัส */}
            <fieldset className="space-y-3">
              <legend className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Users className="h-3 w-3" />
                ข้อมูลสายรหัส
              </legend>

              {/* เลือกพี่รหัส — grouped by generation */}
              {!isEdit && (
                <div className="space-y-1.5">
                  <Label className="text-sm">พี่รหัส</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger className="transition-shadow focus:ring-2">
                      <SelectValue placeholder="เลือกพี่รหัส" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Crown className="h-3.5 w-3.5" />
                          ไม่มีพี่ (Root Node)
                        </div>
                      </SelectItem>

                      {nodesByGeneration.map(([gen, nodes]) => (
                        <SelectGroup key={gen}>
                          <SelectLabel className="flex items-center gap-1.5 text-xs">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: getGenerationColor(gen),
                              }}
                            />
                            รุ่นที่ {gen}
                          </SelectLabel>
                          {nodes.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback
                                    className="text-[10px] font-semibold text-white"
                                    style={{
                                      backgroundColor: getGenerationColor(
                                        n.generation
                                      ),
                                    }}
                                  >
                                    {getInitials(n.nickname)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {n.nickname}
                                </span>
                                {n.studentId && (
                                  <span className="text-xs text-muted-foreground">
                                    {n.studentId}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Generation preview chip */}
                  {parentId !== "none" && selectedParent && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback
                          className="text-[10px] font-semibold text-white"
                          style={{
                            backgroundColor: getGenerationColor(
                              selectedParent.generation
                            ),
                          }}
                        >
                          {getInitials(selectedParent.nickname)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedParent.nickname}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="font-semibold" style={{ color: genColor }}>
                        {nickname.trim() || "สมาชิกใหม่"}
                      </span>
                      <Badge
                        className="ml-auto gap-1 text-white"
                        style={{ backgroundColor: genColor }}
                      >
                        รุ่น {estimatedGeneration}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* สถานะ — visual pills */}
              <div className="space-y-1.5">
                <Label className="text-sm">สถานะ</Label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isActive = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${
                          isActive
                            ? `${opt.bgColor} ${opt.textColor} border-current shadow-sm`
                            : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full transition-transform ${opt.dotColor} ${isActive ? "scale-125" : "scale-100 opacity-50"}`}
                        />
                        <span className="text-xs font-medium">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading || !nickname.trim()}
              className="min-w-[100px] gap-2 text-white"
              style={{
                backgroundColor:
                  !loading && nickname.trim()
                    ? isEdit
                      ? getGenerationColor(editNode?.generation ?? 1)
                      : genColor
                    : undefined,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : isEdit ? (
                <>
                  <Pencil className="h-4 w-4" />
                  บันทึก
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  เพิ่มสมาชิก
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}