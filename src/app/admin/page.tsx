"use client";

import * as React from "react";
import Link from "next/link";
import {
  getAdminStatsAction,
  getCalculationsTableAction,
  cleanupJunkDataAction,
  bulkDeleteCalculationsAction,
  AdminDashboardStats,
} from "@/app/actions/admin.action";
import { toggleStarCalculationAction, deleteCalculationAction } from "@/app/actions/calculations.action";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  HardDrive,
  Trash2,
  Sparkles,
  Eye,
  Star,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Users,
  Layers,
} from "lucide-react";
import { getAuthStatusAction } from "@/app/actions/auth.action";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminPbacTab } from "./AdminPbacTab";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const TOOL_OPTIONS = [
  { value: "all", label: "Tất cả công cụ" },
  { value: "loan-calculator", label: "Tính Lãi Vay" },
  { value: "bill-split", label: "Chia Hóa Đơn" },
  { value: "interest-rate", label: "Tính Lãi Kép" },
  { value: "currency-converter", label: "Quy Đổi Ngoại Tệ" },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface CalculationRecord {
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  shareSlug: string;
  isStarred: boolean;
  viewCount: number;
  dataSizeBytes: number;
  createdAt: string;
}

interface AdminUserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<AdminUserInfo | null>(null);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"storage" | "users" | "pbac">("storage");

  const [stats, setStats] = React.useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  // Table State
  const [records, setRecords] = React.useState<CalculationRecord[]>([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [toolFilter, setToolFilter] = React.useState("all");
  const [starredOnly, setStarredOnly] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loadingTable, setLoadingTable] = React.useState(false);

  // Selection & Actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    getAuthStatusAction().then((res) => {
      if (res.isAuthenticated && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });
  }, []);

  // Load Stats
  const loadStats = React.useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getAdminStatsAction();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load Table Records
  const loadTable = React.useCallback(async () => {
    setLoadingTable(true);
    try {
      const data = await getCalculationsTableAction({
        page,
        pageSize,
        toolFilter,
        starredOnly,
        search: searchQuery,
      });
      setRecords(data.records || []);
      setTotalRecords(data.total || 0);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  }, [page, pageSize, toolFilter, starredOnly, searchQuery]);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  React.useEffect(() => {
    loadTable();
  }, [loadTable]);

  // Handle Star Toggle
  const handleToggleStar = async (id: string) => {
    const res = await toggleStarCalculationAction(id);
    if (res.success) {
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isStarred: Boolean(res.isStarred) } : r))
      );
      loadStats();
    }
  };

  // Handle Single Delete
  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này khỏi cơ sở dữ liệu?")) return;
    setActionLoading(true);
    const res = await deleteCalculationAction(id);
    if (res.success) {
      setFeedbackMessage({ type: "success", text: `Đã xóa thành công và giải phóng ${formatBytes(res.bytesFreed || 0)}` });
      loadTable();
      loadStats();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Xóa thất bại" });
    }
    setActionLoading(false);
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} bản ghi đã chọn?`)) return;
    setActionLoading(true);
    const res = await bulkDeleteCalculationsAction(selectedIds);
    if (res.success) {
      setFeedbackMessage({ type: "success", text: `Đã xóa ${res.count} bản ghi, giải phóng ${formatBytes(res.bytesFreed || 0)}` });
      loadTable();
      loadStats();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Lỗi khi xóa hàng loạt" });
    }
    setActionLoading(false);
  };

  // Handle Junk Cleanup Action
  const handleCleanup = async (type: "older_than_days" | "zero_views" | "all_unstarred", days?: number) => {
    let confirmMsg = "";
    if (type === "older_than_days") {
      confirmMsg = `Bạn muốn xóa tất cả bản ghi không có Star cũ hơn ${days} ngày?`;
    } else if (type === "zero_views") {
      confirmMsg = "Bạn muốn xóa tất cả bản ghi không có Star và có 0 lượt xem?";
    } else {
      confirmMsg = "CẢNH BÁO: Bạn muốn xóa TOÀN BỘ các bản ghi chưa được đánh dấu Star?";
    }

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    const res = await cleanupJunkDataAction({ type, days });
    if (res.success) {
      setFeedbackMessage({ type: "success", text: res.message || "Dọn dẹp hoàn tất" });
      loadTable();
      loadStats();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Dọn dẹp thất bại" });
    }
    setActionLoading(false);
  };

  // Select all toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (authChecking) {
    return (
      <div className="py-24 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span>Đang xác minh phân quyền quản trị...</span>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="danger" className="text-xs font-semibold px-3 py-1">
            403 Forbidden Access
          </Badge>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Quyền Truy Cập Bị Từ Chối
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Khu vực Quản trị tối cao (Admin Control Center) chỉ dành riêng cho tài khoản có vai trò <strong>Admin</strong>. Người dùng thông thường không có quyền dọn dẹp hệ thống hoặc phân quyền.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!currentUser ? (
            <Link href="/login">
              <Button className="w-full sm:w-auto font-semibold">
                Đăng nhập tài khoản Admin
              </Button>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground w-full">
              Bạn đang đăng nhập với tài khoản: <strong>{currentUser.email}</strong> (Vai trò: {currentUser.role})
            </p>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Về trang chủ công cụ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Control Center • Supabase PostgreSQL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Bảng Quản Trị Hệ Thống & Phân Quyền
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quản trị viên: <span className="font-semibold text-foreground">{currentUser.name || currentUser.email}</span> • Dọn rác, quản lý người dùng và phân quyền kép RBAC/PBAC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadStats();
              loadTable();
            }}
            className="gap-1.5 text-xs rounded-xl"
            disabled={loadingStats || loadingTable}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStats || loadingTable ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>

          <Link href="/">
            <Button size="sm" className="gap-1.5 text-xs rounded-xl">
              <span>Về trang chủ</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "storage"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <HardDrive className="h-4 w-4" />
          <span>Dọn Dẹp Rác & Dung Lượng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "users"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Quản Lý Người Dùng (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pbac")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "pbac"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Ma Trận Tính Năng Động (PBAC)</span>
        </button>
      </div>

      {/* Tab 2 Content */}
      {activeTab === "users" && <AdminUsersTab currentAdminEmail={currentUser.email} />}

      {/* Tab 3 Content */}
      {activeTab === "pbac" && <AdminPbacTab />}

      {/* Tab 1 Content (Storage & Cleaner) */}
      {activeTab === "storage" && (
        <div className="space-y-8">
          {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="font-bold ml-4 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Storage Limit */}
        <Card className="p-5 border-border/80 bg-card/60 backdrop-blur-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Dung Lượng Đang Dùng</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">
              {stats ? formatBytes(stats.totalBytes) : "..."}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hạn mức Free Tier: 500 MB
            </p>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (stats?.storageUsagePercent || 0) > 85
                    ? "bg-rose-500"
                    : (stats?.storageUsagePercent || 0) > 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(2, Math.min(100, (stats?.storageUsagePercent || 0) * 10))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{stats?.storageUsagePercent || 0}% hạn mức</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">An toàn</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Total Records */}
        <Card className="p-5 border-border/80 bg-card/60 backdrop-blur-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tổng Bản Ghi History</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">
              {stats ? stats.totalRecords : "..."}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Được bảo vệ: <strong className="text-amber-500">{stats?.starredCount || 0}</strong> Starred
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>Bản ghi có Star không bị xóa dọn rác</span>
          </div>
        </Card>

        {/* Card 3: Total Views */}
        <Card className="p-5 border-border/80 bg-card/60 backdrop-blur-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Lượt Xem Chia Sẻ</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">
              {stats ? stats.totalViews : "..."}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Lượt xem qua liên kết cố định
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Mỗi lượt xem tự động sync Supabase</span>
          </div>
        </Card>

        {/* Card 4: Junk Data Candidates */}
        <Card className="p-5 border-border/80 bg-card/60 backdrop-blur-md shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Dữ Liệu Rác Tiềm Năng</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-500">
              {stats ? stats.junkCandidateCount : "..."}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ước tính: {stats ? formatBytes(stats.junkCandidateBytes) : "0 KB"}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Bản ghi &gt;30 ngày hoặc 0 view</span>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      {stats && stats.toolsBreakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Breakdown by Tool */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Dung Lượng Theo Công Cụ</h3>
                <p className="text-[11px] text-muted-foreground">Phân bổ tỷ trọng byte dữ liệu lưu trữ</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.toolsBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="toolId" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => formatBytes(val)} />
                  <Tooltip
                    formatter={(val: unknown) => [formatBytes(Number(val)), "Dung lượng"]}
                    labelFormatter={(label) => `Công cụ: ${label}`}
                  />
                  <Bar dataKey="totalBytes" radius={[6, 6, 0, 0]}>
                    {stats.toolsBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: 7 Days Activity */}
          <Card className="lg:col-span-6 border-border/80 bg-card/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Xu Hướng Lưu Trữ 7 Ngày Gần Đây</h3>
                <p className="text-[11px] text-muted-foreground">Số lượng snapshot tính toán mới mỗi ngày</p>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.recentDailyStats}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(val: unknown) => [String(val), "Số bản ghi"]} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Junk Data Cleaner Action Hub */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card/90 to-destructive/5 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Trung Tâm Dọn Dẹp Dữ Liệu Rác (Junk Cleaner)
              </h2>
              <p className="text-xs text-muted-foreground">
                Giải phóng dung lượng nhanh chóng. Các bản ghi có gắn <Star className="h-3 w-3 inline text-amber-400 fill-amber-400" /> sẽ được bảo vệ tuyệt đối.
              </p>
            </div>
          </div>

          <div className="text-xs font-medium text-muted-foreground">
            Dữ liệu dọn dẹp không thể phục hồi
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup("older_than_days", 30)}
            disabled={actionLoading}
            className="flex items-center justify-between h-auto py-3 px-4 rounded-2xl hover:border-destructive/40 hover:bg-destructive/5 text-left"
          >
            <div>
              <p className="text-xs font-bold text-foreground">Xóa Cũ &gt; 30 Ngày</p>
              <p className="text-[10px] text-muted-foreground">Loại trừ bản ghi Starred</p>
            </div>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup("older_than_days", 7)}
            disabled={actionLoading}
            className="flex items-center justify-between h-auto py-3 px-4 rounded-2xl hover:border-destructive/40 hover:bg-destructive/5 text-left"
          >
            <div>
              <p className="text-xs font-bold text-foreground">Xóa Cũ &gt; 7 Ngày</p>
              <p className="text-[10px] text-muted-foreground">Giữ lại 1 tuần gần nhất</p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup("zero_views")}
            disabled={actionLoading}
            className="flex items-center justify-between h-auto py-3 px-4 rounded-2xl hover:border-destructive/40 hover:bg-destructive/5 text-left"
          >
            <div>
              <p className="text-xs font-bold text-foreground">Xóa 0 Lượt Xem</p>
              <p className="text-[10px] text-muted-foreground">Bản ghi tạo thử không dùng</p>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup("all_unstarred")}
            disabled={actionLoading}
            className="flex items-center justify-between h-auto py-3 px-4 rounded-2xl border-destructive/30 hover:bg-destructive/10 text-destructive text-left"
          >
            <div>
              <p className="text-xs font-bold">Xóa Tất Cả Chưa Star</p>
              <p className="text-[10px] opacity-80">Chỉ giữ bản ghi đánh sao</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </Card>

      {/* Main Records Table Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Quản Lý Lịch Sử Bản Ghi</h2>
              <Badge variant="accent" className="text-[10px]">
                {totalRecords} bản ghi
              </Badge>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-xs text-muted-foreground">
                  Đã chọn <strong>{selectedIds.length}</strong>
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  className="gap-1.5 text-xs rounded-xl"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa đã chọn</span>
                </Button>
              </div>
            )}
          </div>

          {/* Table Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề hoặc slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={toolFilter}
              onChange={(e) => setToolFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none"
            >
              {TOOL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setStarredOnly(!starredOnly)}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                starredOnly
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${starredOnly ? "fill-amber-400" : ""}`} />
              <span>Chỉ xem Starred</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1 text-muted-foreground hover:text-foreground">
                    {selectedIds.length === records.length && records.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-10 text-center">Star</th>
                <th className="p-3 font-semibold">Tiêu Đề & Slug</th>
                <th className="p-3 font-semibold">Công Cụ</th>
                <th className="p-3 font-semibold text-right">Dung Lượng</th>
                <th className="p-3 font-semibold text-center">Lượt Xem</th>
                <th className="p-3 font-semibold">Ngày Tạo</th>
                <th className="p-3 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingTable ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Đang tải danh sách bản ghi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Không tìm thấy bản ghi nào phù hợp tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(record.id)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleStar(record.id)}
                          className="p-1 text-muted-foreground hover:text-amber-400 transition-colors"
                          title={record.isStarred ? "Bỏ Star (Cho phép dọn rác)" : "Đánh Star (Bảo vệ khỏi dọn rác)"}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              record.isStarred
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        <div className="font-semibold line-clamp-1">{record.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          slug: {record.shareSlug}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {record.toolName}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono text-muted-foreground">
                        {formatBytes(record.dataSizeBytes)}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {record.viewCount}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/share?s=${record.shareSlug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Mở liên kết chia sẻ"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSingle(record.id)}
                            className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Trang {page} / {totalPages} (Tổng {totalRecords} bản ghi)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs h-8 px-2.5"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs h-8 px-2.5"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>
        </div>
      )}
    </div>
  );
}

