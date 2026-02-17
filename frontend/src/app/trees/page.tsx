"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useMyTrees, useDeleteTree } from "@/hooks/use-trees";
import { useSharedWithMe, roleToLabel } from "@/hooks/use-shares";
import { ShareRole } from "@/gen/tree/v1/tree_pb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Share2,
  Eye,
  Pencil,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TreesPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { trees, loading, error, refetch } = useMyTrees();
  const { trees: sharedTrees, loading: sharedLoading } = useSharedWithMe();
  const { deleteTree, loading: deleting } = useDeleteTree();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleDelete = async (id: string) => {
    const success = await deleteTree(id);
    if (success) {
      refetch();
    }
  };

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

  const getRoleIcon = (role: ShareRole) => {
    switch (role) {
      case ShareRole.OWNER:
        return <Crown className="h-3 w-3" />;
      case ShareRole.EDITOR:
        return <Pencil className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">สายรหัสของฉัน</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            สร้างและจัดการต้นไม้สายรหัสของคุณ
          </p>
        </div>

        <Link href="/trees/new">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button className="gap-2 bg-linear-to-r from-green-600 to-emerald-500 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">สร้างสายรหัสใหม่</span>
              <span className="sm:hidden">สร้างใหม่</span>
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      {/* My Trees */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : trees.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {trees.map((tree) => (
              <motion.div
                key={tree.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.35 }}
              >
                <Card
                  className="group relative overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* Accent top bar */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-green-500 to-emerald-400" />

                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/5">
                          <TreePine className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {tree.name}
                          </CardTitle>
                          {tree.faculty && (
                            <CardDescription className="text-xs">
                              {tree.faculty}
                              {tree.department && ` · ${tree.department}`}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
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
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                ลบ
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                  <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <AlertDialogTitle className="text-center">
                                  ลบสายรหัส &quot;{tree.name}&quot;?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-center">
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
                                  {deleting ? "กำลังลบ..." : "ลบสายรหัส"}
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
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tree.createdAt)}
                      </span>
                      <Link href={`/trees/${tree.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          เปิด
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Shared With Me */}
      {!sharedLoading && sharedTrees.length > 0 && (
        <div className="mt-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold tracking-tight">
                แชร์ให้ฉัน
              </h2>
              <Badge variant="secondary" className="text-xs">
                {sharedTrees.length}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              สายรหัสที่คนอื่นแชร์มาให้คุณ
            </p>
          </motion.div>

          <motion.div
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {sharedTrees.map((tree) => (
              <motion.div
                key={tree.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.35 }}
              >
                <Card className="group relative overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  {/* Blue accent for shared trees */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-indigo-400" />

                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/10 to-indigo-500/5">
                          <Share2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {tree.name}
                          </CardTitle>
                          {tree.faculty && (
                            <CardDescription className="text-xs">
                              {tree.faculty}
                              {tree.department && ` · ${tree.department}`}
                            </CardDescription>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] font-medium"
                      >
                        {getRoleIcon(tree.myRole)}
                        {roleToLabel(tree.myRole)}
                      </Badge>
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
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(tree.createdAt)}
                      </span>
                      <Link href={`/trees/${tree.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          เปิด
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub Components ─── */

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-1 bg-muted" />
            <CardHeader className="pt-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
        <TreePine className="h-8 w-8 text-green-300" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">ยังไม่มีสายรหัส</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        เริ่มต้นสร้างสายรหัสแรกของคุณ แล้วเพิ่มสมาชิกลงไปได้เลย
      </p>
      <Link href="/trees/new">
        <Button className="mt-6 gap-2 bg-linear-to-r from-green-600 to-emerald-500 shadow-sm">
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
    <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-950/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="mt-3 font-medium text-red-600">{message}</p>
      <Button
        variant="outline"
        className="mt-4 gap-2"
        onClick={onRetry}
      >
        <RefreshCw className="h-4 w-4" />
        ลองใหม่
      </Button>
    </div>
  );
}