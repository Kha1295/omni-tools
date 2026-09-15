"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getUserDashboardStats,
  getUserToolLogs,
  deleteToolLog,
  clearAllUserToolLogs,
  getUserBookmarks,
} from "@/app/actions/user.action";
import { getAuthStatusAction } from "@/app/actions/auth.action";
import {
  Calculator,
  Bookmark,
  Calendar,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
} from "lucide-react";

interface LogItem {
  id: string;
  toolId: string;
  title: string | null;
  inputData: unknown;
  resultData: unknown;
  createdAt: string | Date;
}

interface DashboardStats {
  totalLogs: number;
  totalBookmarks: number;
  weeklyLogs: number;
  toolDistribution: Array<{ toolId: string; count: number }>;
  userRole: string;
  userEmail: string;
  userName: string | null;
}

interface BookmarkItem {
  id: string;
  toolId: string;
  customTitle: string | null;
}

const TOOL_MAP: Record<string, { name: string; url: string }> = {
  "loan-calculator": { name: "Tính lãi vay & lịch trả", url: "/finance/loan-calculator" },
  "bill-split": { name: "Chia tiền nhóm & Tip", url: "/finance/bill-split" },
  "interest-rate": { name: "Lãi suất kép & Tiết kiệm", url: "/finance/interest-rate" },
  "currency-converter": { name: "Quy đổi ngoại tệ", url: "/convert/currency" },
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [logs, setLogs] = React.useState<LogItem[]>([]);
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [selectedTool, setSelectedTool] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getAuthStatusAction();
      if (!auth.isAuthenticated) {
        router.push("/login");
        return;
      }

      const [statsData, logsData, bookmarksData] = await Promise.all([
        getUserDashboardStats(),
        getUserToolLogs({ toolId: selectedTool, search: searchQuery, page }),
        getUserBookmarks(),
      ]);

      setStats(statsData);
      setBookmarks(bookmarksData || []);
      if (logsData.success) {
        setLogs(logsData.data as LogItem[]);
        setTotalPages(logsData.totalPages || 1);
      }
    } catch (err) {
      console.error("Lỗi tải dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [router, selectedTool, searchQuery, page]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi lịch sử này?")) return;
    const res = await deleteToolLog(id);
    if (res.success) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
      if (stats) {
        setStats({ ...stats, totalLogs: Math.max(0, stats.totalLogs - 1) });
      }
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Cảnh báo: Toàn bộ lịch sử tính toán cá nhân của bạn sẽ bị xóa. Bạn có muốn tiếp tục?")) {
      return;
    }
    setIsDeletingAll(true);
    const res = await clearAllUserToolLogs();
    setIsDeletingAll(false);
    if (res.success) {
      setLogs([]);
      if (stats) setStats({ ...stats, totalLogs: 0, weeklyLogs: 0 });
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["ID", "Công cụ", "Tiêu đề", "Ngày tạo", "Dữ liệu đầu vào", "Kết quả"];
    const rows = logs.map((l) => [
      l.id,
      TOOL_MAP[l.toolId]?.name || l.toolId,
      l.title || "Không có tiêu đề",
      new Date(l.createdAt).toLocaleString("vi-VN"),
      JSON.stringify(l.inputData).replace(/"/g, '""'),
      JSON.stringify(l.resultData).replace(/"/g, '""'),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => `"${e.join('","')}"`)].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `omni-tools-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `omni-tools-history-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Profile & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <span>Bảng điều khiển cá nhân</span>
            {stats?.userRole && (
              <Badge variant="default" className="text-xs">
                {stats.userRole}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chào mừng, <span className="font-semibold text-foreground">{stats?.userName || stats?.userEmail}</span>. Quản lý toàn bộ lịch sử tính toán và công cụ đã ghim của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button variant="outline" size="sm" onClick={exportCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Xuất CSV
          </Button>

          <Button variant="outline" size="sm" onClick={exportJSON} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            JSON
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng lượt tính toán</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats?.totalLogs ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Đã lưu trữ an toàn trên Cloud</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tính toán trong 7 ngày</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats?.weeklyLogs ?? 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Hoạt động gần đây</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Công cụ yêu thích đã ghim</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {stats?.totalBookmarks ?? bookmarks.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Truy cập nhanh tức thì</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bookmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks Quick Access */}
      {bookmarks.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span>Công cụ đã ghim của bạn</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {bookmarks.map((bm) => (
                <Link
                  key={bm.id}
                  href={TOOL_MAP[bm.toolId]?.url || "/"}
                  className="p-3 rounded-xl border border-border/80 hover:border-primary/40 bg-card hover:bg-muted/60 transition-all flex items-center justify-between group"
                >
                  <div className="truncate">
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {bm.customTitle || TOOL_MAP[bm.toolId]?.name || bm.toolId}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {TOOL_MAP[bm.toolId]?.name}
                    </p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tool Logs Section */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Nhật ký tính toán chi tiết</span>
              </CardTitle>
              <CardDescription>
                Xem lại, chạy lại các phương án tính toán hoặc tải xuống dữ liệu
              </CardDescription>
            </div>

            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isDeletingAll}
                className="text-red-600 hover:bg-red-500/10 border-red-200 dark:border-red-900/40"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {isDeletingAll ? "Đang xóa..." : "Xóa tất cả"}
              </Button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tiêu đề hoặc tên công cụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả công cụ</option>
                <option value="loan-calculator">Tính lãi vay</option>
                <option value="bill-split">Chia tiền bill</option>
                <option value="interest-rate">Lãi suất kép</option>
                <option value="currency-converter">Quy đổi ngoại tệ</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Đang nạp dữ liệu nhật ký...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                <Calculator className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Chưa có bản ghi tính toán nào</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Khi bạn sử dụng các công cụ trên Omni-tools, kết quả tính toán sẽ tự động được lưu trữ tại đây để bạn có thể tra cứu lại bất cứ lúc nào.
              </p>
              <div className="pt-2">
                <Link href="/">
                  <Button size="sm">
                    <span>Khám phá công cụ ngay</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground bg-muted/30">
                    <th className="p-3 font-semibold">Công cụ</th>
                    <th className="p-3 font-semibold">Tiêu đề / Thời gian</th>
                    <th className="p-3 font-semibold">Tóm tắt thông số</th>
                    <th className="p-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => {
                    const toolMeta = TOOL_MAP[log.toolId] || { name: log.toolId, url: "/" };
                    return (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 align-top">
                          <Badge variant="outline" className="font-medium text-[11px]">
                            {toolMeta.name}
                          </Badge>
                        </td>
                        <td className="p-3 align-top space-y-0.5">
                          <p className="font-semibold text-foreground text-xs">
                            {log.title || "Bản tính không đặt tên"}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </td>
                        <td className="p-3 align-top max-w-xs truncate">
                          <div className="text-[11px] text-muted-foreground font-mono bg-muted/60 p-2 rounded-lg truncate">
                            {JSON.stringify(log.inputData)}
                          </div>
                        </td>
                        <td className="p-3 align-top text-right space-x-1 whitespace-nowrap">
                          <Link href={toolMeta.url}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" title="Mở lại công cụ">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              <span className="hidden sm:inline">Mở</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/80 pt-4 mt-4">
              <span className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
