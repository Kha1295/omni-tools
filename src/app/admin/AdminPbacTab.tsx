"use client";

import * as React from "react";
import {
  getAccessControlMatrix,
  toggleRolePermission,
  toggleFeaturePublicStatus,
} from "@/app/actions/admin-users.action";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Globe,
  Lock,
  RefreshCw,
  CheckCircle2,
  Check,
  X,
  Layers,
  Sparkles,
} from "lucide-react";

interface MatrixRole {
  id: string;
  code: string;
  name: string;
  rolePermissions: Array<{ permissionId: string }>;
}

interface MatrixPermission {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

interface MatrixFeature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  featurePermissions: Array<{
    permission: { id: string; code: string; name: string };
  }>;
}

interface PbacMatrixData {
  roles: MatrixRole[];
  permissions: MatrixPermission[];
  features: MatrixFeature[];
}

export function AdminPbacTab() {
  const [data, setData] = React.useState<PbacMatrixData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const loadMatrix = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccessControlMatrix();
      setData(res as PbacMatrixData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFeaturePublic = async (featureId: string, currentPublic: boolean) => {
    setUpdatingId(`feat_${featureId}`);
    try {
      const res = await toggleFeaturePublicStatus(featureId, !currentPublic);
      if (res.success) {
        showToast(`Đã ${res.isPublic ? "mở công khai cho Khách" : "yêu cầu đăng nhập"} cho tính năng.`);
        loadMatrix();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRolePermission = async (roleId: string, permissionId: string, isSystemAdmin: boolean) => {
    if (isSystemAdmin) {
      alert("Vai trò Quản trị viên tối cao luôn có toàn bộ quyền hạn hệ thống.");
      return;
    }

    setUpdatingId(`rp_${roleId}_${permissionId}`);
    try {
      const res = await toggleRolePermission(roleId, permissionId);
      if (res.success) {
        showToast(res.granted ? "Đã cấp quyền cho vai trò." : "Đã hủy quyền của vai trò.");
        loadMatrix();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Đang nạp ma trận phân quyền PBAC...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-indigo-600 text-white text-xs font-medium shadow-lg animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Kiến trúc Phân Quyền Kép (RBAC & PBAC)</p>
          <p className="text-muted-foreground leading-relaxed">
            Hệ thống kết hợp giữa vai trò tĩnh (Role-Based Access Control) và ma trận tính năng động (Feature-Permission Based Access Control). Bạn có thể cấu hình tính năng nào được mở miễn phí cho Khách vãng lai (Guest-first) và tính năng nào đòi hỏi phân quyền đặc biệt.
          </p>
        </div>
      </div>

      {/* Feature Access & Guest Openness Section */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Ma Trận Tính Năng & Quyền Truy Cập Của Khách (Guest Openness)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Bật &quot;Công khai cho Khách&quot; để người dùng vãng lai có thể sử dụng trực tiếp mà không bắt buộc đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {data.features.map((feat) => (
              <div
                key={feat.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs text-foreground">{feat.name}</h4>
                    <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {feat.code}
                    </code>
                    {feat.isPublic ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Globe className="h-3 w-3" />
                        Khách dùng được
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Cần đăng nhập & quyền
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{feat.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground">Quyền yêu cầu:</span>
                    {feat.featurePermissions.length === 0 ? (
                      <span className="text-[10px] text-emerald-600 font-medium">Bất kỳ user nào đăng nhập</span>
                    ) : (
                      feat.featurePermissions.map((fp) => (
                        <code
                          key={fp.permission.id}
                          className="text-[10px] bg-primary/10 text-primary font-mono px-1.5 py-0.5 rounded"
                        >
                          {fp.permission.code}
                        </code>
                      ))
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    variant={feat.isPublic ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFeaturePublic(feat.id, feat.isPublic)}
                    disabled={updatingId === `feat_${feat.id}`}
                    className="text-xs h-8"
                  >
                    {feat.isPublic ? "Đang Mở Khách (Bấm để Khóa)" : "Đang Khóa (Bấm để Mở Khách)"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-Permission Matrix Grid */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Ma Trận Phân Quyền Theo Vai Trò (Role - Permission Matrix)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Bật/tắt phân quyền trực tiếp cho từng vai trò trong hệ thống.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground">
                  <th className="p-3 font-semibold min-w-[200px]">Mã Quyền Hạn (Permission)</th>
                  <th className="p-3 font-semibold min-w-[120px]">Phân loại</th>
                  {data.roles.map((r) => (
                    <th key={r.id} className="p-3 font-semibold text-center min-w-[120px]">
                      <div>
                        <p className="text-foreground font-bold">{r.name}</p>
                        <code className="text-[10px] text-muted-foreground">({r.code})</code>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.permissions.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 align-middle">
                      <div>
                        <p className="font-semibold text-foreground text-xs">{p.name}</p>
                        <code className="text-[10px] text-muted-foreground font-mono">{p.code}</code>
                      </div>
                    </td>

                    <td className="p-3 align-middle">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {p.category}
                      </Badge>
                    </td>

                    {data.roles.map((r) => {
                      const hasPerm =
                        r.code === "admin" ||
                        r.rolePermissions.some((rp) => rp.permissionId === p.id);
                      const isSystemAdmin = r.code === "admin";

                      return (
                        <td key={r.id} className="p-3 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRolePermission(r.id, p.id, isSystemAdmin)}
                            disabled={isSystemAdmin || updatingId === `rp_${r.id}_${p.id}`}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              hasPerm
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                            } ${isSystemAdmin ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}`}
                            title={
                              isSystemAdmin
                                ? "Admin luôn có toàn quyền"
                                : hasPerm
                                ? "Bấm để gỡ bỏ quyền này"
                                : "Bấm để cấp quyền này"
                            }
                          >
                            {hasPerm ? <Check className="h-4 w-4 stroke-[2.5]" /> : <X className="h-4 w-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

