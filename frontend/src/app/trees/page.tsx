"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useMyTrees, useDeleteTree } from "@/hooks/use-trees";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  TreePine,
  MoreVertical,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function TreesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { trees, loading, error, refetch } = useMyTrees();
  const { deleteTree, loading: deleting } = useDeleteTree();

  // Redirect ถ้าไม่ได้ login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Handle delete
  const handleDelete = async (id: string) => {
    const success = await deleteTree(id);
    if (success) {
      refetch();
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">สายรหัสของฉัน</h1>
          <p className="text-muted-foreground">
            สร้างและจัดการต้นไม้สายรหัสของคุณ
          </p>
        </div>

        <Link href="/trees/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            สร้างสายรหัสใหม่
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : trees.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trees.map((tree) => (
              <Card
                key={tree.id}
                className="group transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                        <TreePine className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tree.name}</CardTitle>
                        {tree.faculty && (
                          <CardDescription className="text-xs">
                            {tree.faculty}
                            {tree.department && ` · ${tree.department}`}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    {/* Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/trees/${tree.id}`)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          เปิด
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ลบสายรหัส &quot;{tree.name}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                การลบจะไม่สามารถกู้คืนได้
                                ข้อมูลสมาชิกทั้งหมดในสายรหัสนี้จะถูกลบด้วย
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(tree.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleting}
                              >
                                {deleting ? "กำลังลบ..." : "ลบ"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {tree.description && (
                  <CardContent className="pb-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {tree.description}
                    </p>
                  </CardContent>
                )}

                <CardFooter className="pt-0">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      สร้างเมื่อ {formatDate(tree.createdAt)}
                    </span>
                    <Link href={`/trees/${tree.id}`}>
                      <Button variant="outline" size="sm">
                        เปิด
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Sub Components ====================

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed p-12 text-center">
      <TreePine className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        ยังไม่มีสายรหัส
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        เริ่มต้นสร้างสายรหัสแรกของคุณ
      </p>
      <Link href="/trees/new">
        <Button className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          สร้างสายรหัสใหม่
        </Button>
      </Link>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-red-600">{message}</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        ลองใหม่
      </Button>
    </div>
  );
}