"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { registerAction } from "@/app/actions/auth.action";
import { getGuestHistory, clearGuestHistory } from "@/lib/guestHistory";
import { syncGuestHistoryAction } from "@/app/actions/user.action";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
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

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerAction({
        email,
        password,
        name: name || undefined,
      });

      if (!res.success) {
        setError(res.error || "Đăng ký thất bại.");
        setLoading(false);
        return;
      }

      // Tự động đồng bộ lịch sử khách từ máy lên tài khoản mới
      const guestHistory = getGuestHistory();
      if (guestHistory.length > 0) {
        await syncGuestHistoryAction(guestHistory);
        clearGuestHistory();
      }

      window.dispatchEvent(new CustomEvent("omni:auth-changed"));

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không mong muốn.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      {/* Banner thông tin quyền lợi */}
      <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Tài khoản Normal miễn phí vĩnh viễn</p>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>Lưu trữ lịch sử tính toán không giới hạn trên Cloud</li>
            <li>Ghim bookmark công cụ yêu thích & nạp sẵn thông số</li>
            <li>Xuất file dữ liệu CSV & JSON bất cứ lúc nào</li>
          </ul>
          {guestCount > 0 && (
            <p className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 pt-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Sẽ tự động đồng bộ {guestCount} bản tính trước đó của bạn vào tài khoản!
            </p>
          )}
        </div>
      </div>

      <Card className="shadow-lg border-border/80">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Đăng ký tài khoản mới</CardTitle>
          <CardDescription>
            Bắt đầu quản lý phương án tính toán và đồng bộ đa thiết bị
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
              <label className="text-xs font-semibold text-foreground">Họ và tên / Biệt danh</label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

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
              <label className="text-xs font-semibold text-foreground">Mật khẩu</label>
              <Input
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Xác nhận mật khẩu</label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? "Đang khởi tạo tài khoản..." : "Tạo tài khoản Normal"}
              {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Đăng nhập tại đây
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
