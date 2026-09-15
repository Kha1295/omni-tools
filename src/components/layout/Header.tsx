"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sun,
  Moon,
  Menu,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { getAuthStatusAction, logoutAction } from "@/app/actions/auth.action";

interface HeaderProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  roleName?: string;
}

export function Header({ onOpenSearch, onToggleSidebar }: HeaderProps) {
  const { isDark, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchAuth = React.useCallback(async () => {
    try {
      const res = await getAuthStatusAction();
      if (res.isAuthenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAuth();

    const handleAuthChange = () => {
      fetchAuth();
    };

    window.addEventListener("omni:auth-changed", handleAuthChange);
    return () => window.removeEventListener("omni:auth-changed", handleAuthChange);
  }, [fetchAuth]);

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    window.dispatchEvent(new CustomEvent("omni:auth-changed"));
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl border border-border bg-card/80 hover:bg-muted text-muted-foreground transition-all"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                  omni<span className="text-primary font-black">.tools</span>
                </span>
                <Badge variant="success" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                  Guest-Ready
                </Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Quick Search Trigger Button */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            id="search-modal-trigger"
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-muted-foreground bg-muted/60 hover:bg-muted/90 border border-border/80 rounded-xl transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span>Tìm kiếm công cụ...</span>
            </span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions, Auth State & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl border border-border bg-card/80 hover:bg-muted text-muted-foreground transition-all"
            aria-label="Search tools"
          >
            <Search className="h-5 w-5" />
          </button>

          {!loading && (
            <>
              {user ? (
                // Authenticated State
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-card hover:bg-muted border border-border px-3 py-2 rounded-xl transition-all"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-3 py-2 rounded-xl transition-all"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Admin</span>
                    </Link>
                  )}

                  <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/40 border border-border text-xs">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[110px]">{user.name || user.email.split("@")[0]}</span>
                    <Badge variant={user.role === "admin" ? "danger" : user.role === "vip_member" ? "warning" : "default"} className="text-[10px] py-0 px-1 ml-0.5">
                      {user.role === "admin" ? "Admin" : user.role === "vip_member" ? "VIP" : "Normal"}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-2 rounded-xl border border-border bg-card hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Guest State (No forced login)
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border px-3 py-2 rounded-xl transition-all"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Đăng nhập</span>
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-xl shadow-sm transition-all"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Đăng ký</span>
                  </Link>
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2.5 rounded-xl border border-border bg-card/80 hover:bg-muted text-foreground transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
