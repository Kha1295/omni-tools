"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Cloud, Trash2, ArrowRight, UserPlus, Clock } from "lucide-react";
import { getGuestHistory, removeGuestHistoryItem, GuestToolLogItem } from "@/lib/guestHistory";
import { getAuthStatusAction } from "@/app/actions/auth.action";

interface ToolGuestHistoryWidgetProps {
  toolId: string;
  onRestoreParams?: (inputData: Record<string, unknown>) => void;
}

export function ToolGuestHistoryWidget({
  toolId,
  onRestoreParams,
}: ToolGuestHistoryWidgetProps) {
  const [items, setItems] = React.useState<GuestToolLogItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const loadHistory = React.useCallback(() => {
    const all = getGuestHistory();
    const toolItems = all.filter((i) => i.toolId === toolId);
    setItems(toolItems);
  }, [toolId]);

  React.useEffect(() => {
    loadHistory();

    getAuthStatusAction().then((res) => {
      setIsAuthenticated(res.isAuthenticated);
    });

    const handleUpdate = () => loadHistory();
    window.addEventListener("omni:guest-history-updated", handleUpdate);
    return () => window.removeEventListener("omni:guest-history-updated", handleUpdate);
  }, [loadHistory]);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeGuestHistoryItem(id);
    loadHistory();
  };

  const handleClear = () => {
    if (confirm("Xóa lịch sử tính toán lưu tạm trên máy cho công cụ này?")) {
      const all = getGuestHistory();
      const remaining = all.filter((i) => i.toolId !== toolId);
      if (typeof window !== "undefined") {
        localStorage.setItem("omni_guest_tool_history", JSON.stringify(remaining));
        window.dispatchEvent(new CustomEvent("omni:guest-history-updated"));
      }
      setItems([]);
    }
  };

  if (items.length === 0 && isAuthenticated) {
    return null; // Người dùng đã đăng nhập và không có lịch sử cục bộ cũ
  }

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden mt-6">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>Lịch sử tính gần đây trên máy</span>
            <Badge variant="outline" className="text-[10px] font-normal">
              {items.length} bản ghi
            </Badge>
          </CardTitle>
        </div>

        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Xóa lịch sử máy
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {/* Banner mời đăng ký nếu chưa đăng nhập */}
        {!isAuthenticated && (
          <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <Cloud className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>
                Bạn đang sử dụng ẩn danh. Tạo tài khoản để lưu trữ vĩnh viễn trên đám mây.
              </span>
            </div>
            <Link href="/register">
              <Button size="sm" className="h-7 text-xs font-semibold px-2.5 shadow-none shrink-0">
                <UserPlus className="h-3 w-3 mr-1" />
                Đồng bộ Cloud
              </Button>
            </Link>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Chưa có phép tính nào được lưu lại trên trình duyệt này.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => onRestoreParams && onRestoreParams(item.inputData)}
                className={`p-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-muted/60 transition-all text-xs flex flex-col justify-between group ${
                  onRestoreParams ? "cursor-pointer hover:border-primary/40" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {item.title || "Phép tính"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item.id, e)}
                      className="text-muted-foreground hover:text-red-500 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {JSON.stringify(item.inputData)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {onRestoreParams && (
                    <span className="text-primary font-medium group-hover:underline flex items-center gap-0.5">
                      Nạp lại <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
