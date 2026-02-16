"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, TreePine, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Navbar() {
  const router = useRouter();
  const { user, loading, signOut, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("ออกจากระบบแล้ว");
    router.push("/login");
    router.refresh();
  };

  const getInitials = () => {
    const name =
      user?.user_metadata?.display_name || user?.email || "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <motion.nav
      className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <TreePine className="h-4 w-4 text-white" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight">
            Code <span className="text-green-600">Tree</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Link href="/trees">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  สายรหัสของฉัน
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-full pl-1 pr-2"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-linear-to-br from-green-500 to-emerald-600 text-xs font-semibold text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {user?.user_metadata?.display_name || "User"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-linear-to-br from-green-500 to-emerald-600 text-sm font-semibold text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">
                        {user?.user_metadata?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    โปรไฟล์
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="gap-1 bg-linear-to-r from-green-600 to-emerald-500 shadow-sm"
                >
                  สมัครสมาชิก
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}