"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { loginAction } from "@/app/actions/auth.action";
import { getGuestHistory, clearGuestHistory } from "@/lib/guestHistory";
import { syncGuestHistoryAction } from "@/app/actions/user.action";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [guestCount, setGuestCount] = React.useState(0);

  React.useEffect(() => {
    const history = getGuestHistory();
    setGuestCount(history.length);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setError(res.error || "Đăng nhập thất bại.");
        setLoading(false);
        return;
      }

      // Tự động đồng bộ lịch sử khách nếu có
      const guestHistory = getGuestHistory();
      if (guestHistory.length > 0) {
        await syncGuestHistoryAction(guestHistory);
        clearGuestHistory();
      }

      window.dispatchEvent(new CustomEvent("omni:auth-changed"));

      if (res.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không mong muốn.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {/* Khách vãng lai Notice */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Trải nghiệm không rào cản cho Khách</p>
          <p className="text-muted-foreground leading-relaxed">
            Bạn vẫn có thể tính toán và chia sẻ kết quả trực tiếp mà <strong>không bắt buộc</strong> phải đăng nhập. Đăng nhập giúp bạn đồng bộ toàn bộ lịch sử lên Cloud và truy cập các tính năng nâng cao.
          </p>
          {guestCount > 0 && (
            <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Phát hiện {guestCount} kết quả tính toán gần đây trên máy sẽ tự động đồng bộ khi đăng nhập!
            </p>
          )}
        </div>
      </div>

      <Card className="shadow-lg border-border/80">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Đăng nhập tài khoản</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu của bạn để quản lý bảng điều khiển
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Địa chỉ Email</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Mật khẩu</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Đăng ký tài khoản mới (Miễn phí)
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
