"use client";

import { useState, useEffect } from "react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TreeNodeData, getGenerationColor } from "@/lib/tree/layout-engine";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/tree/tree-utils";

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
  // สำหรับ edit mode (Day 10)
  editNode?: TreeNodeData | null;
}

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

  // Reset form เมื่อ dialog เปิด
  useEffect(() => {
    if (open) {
      if (editNode) {
        setTimeout(() => {
          setNickname(editNode.nickname || "");
          setFirstName(editNode.firstName || "");
          setLastName(editNode.lastName || "");
          setStudentId(editNode.studentId || "");
          setParentId(editNode.parentId || "none");
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

  // คำนวณ generation ที่จะได้
  const selectedParent = allNodes.find((n) => n.id === parentId);
  const estimatedGeneration = selectedParent
    ? selectedParent.generation + 1
    : 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มคนใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลสมาชิกในสายรหัส"
              : "เพิ่มสมาชิกใหม่ลงในสายรหัส"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* ชื่อเล่น */}
            <div className="space-y-2">
              <Label htmlFor="nickname">
                ชื่อเล่น <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nickname"
                placeholder="เช่น เจมส์, มิ้นท์, บีม"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>

            {/* ชื่อ-นามสกุล */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">ชื่อจริง</Label>
                <Input
                  id="firstName"
                  placeholder="ชื่อจริง"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">นามสกุล</Label>
                <Input
                  id="lastName"
                  placeholder="นามสกุล"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* รหัสนักศึกษา */}
            <div className="space-y-2">
              <Label htmlFor="studentId">รหัสนักศึกษา</Label>
              <Input
                id="studentId"
                placeholder="เช่น 6401001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            {/* เลือกพี่รหัส */}
            {!isEdit && (
              <div className="space-y-2">
                <Label>พี่รหัส (Parent)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพี่รหัส" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">
                        ไม่มีพี่ (Root Node)
                      </span>
                    </SelectItem>
                    {allNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
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
                          <span>
                            {node.nickname}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (รุ่น {node.generation})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* แสดง generation ที่จะได้ */}
                <p className="text-xs text-muted-foreground">
                  จะเป็นรุ่นที่{" "}
                  <span
                    className="font-bold"
                    style={{ color: getGenerationColor(estimatedGeneration) }}
                  >
                    {estimatedGeneration}
                  </span>
                </p>
              </div>
            )}

            {/* สถานะ */}
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studying">🟢 กำลังศึกษา</SelectItem>
                  <SelectItem value="graduated">🔵 จบแล้ว</SelectItem>
                  <SelectItem value="retired">⚪ พ้นสภาพ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading || !nickname.trim()}>
              {loading
                ? "กำลังบันทึก..."
                : isEdit
                  ? "บันทึก"
                  : "เพิ่มคน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}