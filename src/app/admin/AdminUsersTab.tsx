"use client";

import * as React from "react";
import {
  getAdminUsersList,
  updateUserRole,
  toggleUserStatus,
  setUserCustomPermission,
  removeUserCustomPermission,
} from "@/app/actions/admin-users.action";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Sliders,
  RefreshCw,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface AdminUserRole {
  id: string;
  code: string;
  name: string;
}

interface AdminUserCustomPerm {
  permissionId: string;
  isGranted: boolean;
  reason?: string | null;
  permission: {
    id: string;
    code: string;
    name: string;
  };
}

interface AdminUserItem {
  id: string;
  email: string;
  name: string | null;
  roleId: string;
  role: AdminUserRole;
  isActive: boolean;
  createdAt: string | Date;
  customPermissions: AdminUserCustomPerm[];
  _count: {
    toolLogs: number;
    bookmarks: number;
    savedCalculations: number;
  };
}

interface AdminPermissionItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

interface AdminUsersTabProps {
  currentAdminEmail?: string;
}

export function AdminUsersTab({ currentAdminEmail }: AdminUsersTabProps) {
  const [users, setUsers] = React.useState<AdminUserItem[]>([]);
  const [roles, setRoles] = React.useState<AdminUserRole[]>([]);
  const [permissions, setPermissions] = React.useState<AdminPermissionItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [roleCode, setRoleCode] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Custom Permissions Modal State
  const [selectedUser, setSelectedUser] = React.useState<AdminUserItem | null>(null);
  const [customPermsModalOpen, setCustomPermsModalOpen] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsersList({ search, roleCode, page });
      if (res.success) {
        setUsers(res.users as unknown as AdminUserItem[]);
        setRoles(res.roles as AdminUserRole[]);
        setPermissions(res.allPermissions as AdminPermissionItem[]);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, roleCode, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setActionLoading(userId);
    try {
      const res = await updateUserRole(userId, newRoleId);
      if (res.success) {
        showToast("Đã cập nhật vai trò người dùng thành công.");
        fetchUsers();
      } else {
        alert(res.error || "Không thể cập nhật vai trò.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await toggleUserStatus(userId);
      if (res.success) {
        showToast(res.isActive ? "Đã mở khóa tài khoản." : "Đã tạm khóa tài khoản.");
        fetchUsers();
      } else {
        alert(res.error || "Không thể thay đổi trạng thái.");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetCustomPermission = async (
    userId: string,
    permissionId: string,
    isGranted: boolean,
    reason?: string
  ) => {
    try {
      await setUserCustomPermission({ userId, permissionId, isGranted, reason });
      fetchUsers();
      if (selectedUser) {
        const res = await getAdminUsersList({ search, roleCode, page });
        const refreshedUser = (res.users as unknown as AdminUserItem[])?.find((u) => u.id === userId);
        if (refreshedUser) setSelectedUser(refreshedUser);
      }
      showToast("Đã lưu quyền tùy biến.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi lưu quyền";
      alert(msg);
    }
  };

  const handleResetCustomPermission = async (userId: string, permissionId: string) => {
    try {
      await removeUserCustomPermission(userId, permissionId);
      fetchUsers();
      if (selectedUser) {
        const res = await getAdminUsersList({ search, roleCode, page });
        const refreshedUser = (res.users as unknown as AdminUserItem[])?.find((u) => u.id === userId);
        if (refreshedUser) setSelectedUser(refreshedUser);
      }
      showToast("Đã khôi phục quyền mặc định theo vai trò.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi đặt lại quyền";
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-lg animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control & Search Bar */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo email hoặc họ tên người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value)}
              className="text-xs bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Danh sách Người Dùng & Phân Quyền ({total})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Mặc định đăng ký mới là <code className="text-primary font-bold">normal</code>. Chỉ Admin mới có quyền xóa dữ liệu rác.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Đang tải danh sách người dùng...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Không tìm thấy người dùng nào phù hợp tiêu chí.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground">
                    <th className="p-3 font-semibold">Người dùng</th>
                    <th className="p-3 font-semibold">Vai trò (Role)</th>
                    <th className="p-3 font-semibold">Quyền Tùy Biến</th>
                    <th className="p-3 font-semibold">Lịch sử / Ghim</th>
                    <th className="p-3 font-semibold">Trạng thái</th>
                    <th className="p-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {users.map((u) => {
                    const isSelf = u.email === currentAdminEmail;
                    const customPermsCount = u.customPermissions?.length || 0;

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 align-middle">
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{u.name || "Chưa đặt tên"}</span>
                              {isSelf && (
                                <Badge variant="accent" className="text-[9px] py-0 px-1">
                                  Bạn
                                </Badge>
                              )}
                            </p>
                            <p className="text-muted-foreground text-[11px]">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </td>

                        <td className="p-3 align-middle">
                          <select
                            value={u.roleId}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={actionLoading === u.id}
                            className="text-xs bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3 align-middle">
                          <div className="flex items-center gap-2">
                            {customPermsCount > 0 ? (
                              <Badge variant="warning" className="text-[10px]">
                                {customPermsCount} ghi đè
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Mặc định Role</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setCustomPermsModalOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                              title="Tùy biến quyền cho user này"
                            >
                              <Sliders className="h-3 w-3 mr-1" />
                              Chỉnh quyền
                            </Button>
                          </div>
                        </td>

                        <td className="p-3 align-middle">
                          <div className="text-[11px] text-muted-foreground">
                            <span>{u._count.toolLogs} bản tính</span> •{" "}
                            <span>{u._count.bookmarks} ghim</span>
                          </div>
                        </td>

                        <td className="p-3 align-middle">
                          {u.isActive ? (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <UserCheck className="h-3 w-3" />
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="text-[10px] gap-1">
                              <UserX className="h-3 w-3" />
                              Bị khóa
                            </Badge>
                          )}
                        </td>

                        <td className="p-3 align-middle text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={actionLoading === u.id || isSelf}
                            className={`h-7 px-2.5 text-[11px] ${
                              u.isActive
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            }`}
                          >
                            {u.isActive ? "Khóa" : "Mở khóa"}
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
            <div className="p-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Trang {page} / {totalPages} (Tổng {total} người dùng)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs h-7 px-2.5"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="text-xs h-7 px-2.5"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Chỉnh Sửa Quyền Tùy Biến (Custom Permission Overrides) */}
      {customPermsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>Cấu hình Quyền Tùy Biến (User Overrides)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Áp dụng cho: <strong>{selectedUser.name || selectedUser.email}</strong> (Vai trò: {selectedUser.role.name})
                </p>
              </div>
              <button
                onClick={() => setCustomPermsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
              💡 <strong>Quy tắc phân quyền kép:</strong> Quyền tùy biến sẽ ghi đè quyền của vai trò (Role). Bạn có thể ép buộc <strong>Cấp quyền (Grant)</strong> hoặc <strong>Thu hồi quyền (Revoke)</strong> đối với từng tính năng cụ thể.
            </p>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {permissions.map((p) => {
                const override = selectedUser.customPermissions?.find(
                  (cp) => cp.permissionId === p.id
                );

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-border/70 bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{p.name}</span>
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                          {p.code}
                        </code>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {override ? (
                        <>
                          <Badge
                            variant={override.isGranted ? "success" : "danger"}
                            className="text-[10px]"
                          >
                            {override.isGranted ? "Ép cấp (+)" : "Ép chặn (-)"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetCustomPermission(selectedUser.id, p.id)}
                            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                            title="Xóa ghi đè, về mặc định theo Role"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Mặc định
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSetCustomPermission(
                                selectedUser.id,
                                p.id,
                                true,
                                "Admin cấp thêm quyền"
                              )
                            }
                            className="h-7 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10"
                          >
                            + Cấp quyền
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSetCustomPermission(
                                selectedUser.id,
                                p.id,
                                false,
                                "Admin thu hồi quyền"
                              )
                            }
                            className="h-7 px-2 text-[10px] text-rose-600 hover:bg-rose-500/10"
                          >
                            - Thu hồi
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-border/60 pt-3">
              <Button size="sm" onClick={() => setCustomPermsModalOpen(false)}>
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
