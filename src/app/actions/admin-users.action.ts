"use server";

import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/**
 * Lấy danh sách người dùng cho Admin
 */
export async function getAdminUsersList(params: {
  search?: string;
  roleCode?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const whereClause: Prisma.UserWhereInput = {};
  if (params.search) {
    whereClause.OR = [
      { email: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.roleCode && params.roleCode !== "all") {
    whereClause.role = { code: params.roleCode };
  }

  const [total, users, roles, allPermissions] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      include: {
        role: true,
        customPermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            toolLogs: true,
            bookmarks: true,
            savedCalculations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.role.findMany({ orderBy: { code: "asc" } }),
    prisma.permission.findMany({ orderBy: { category: "asc" } }),
  ]);

  return {
    success: true,
    users,
    roles,
    allPermissions,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Thay đổi vai trò (Role) của người dùng
 */
export async function updateUserRole(userId: string, newRoleId: string) {
  const admin = await requireAdmin();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!targetUser) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  // Không cho phép tự hạ quyền của chính mình nếu là Admin duy nhất
  if (targetUser.id === admin.id) {
    const adminCount = await prisma.user.count({
      where: { role: { code: "admin" }, isActive: true },
    });
    const newRole = await prisma.role.findUnique({ where: { id: newRoleId } });
    if (adminCount <= 1 && newRole?.code !== "admin") {
      return {
        success: false,
        error: "Không thể hạ quyền tài khoản Admin cuối cùng trong hệ thống.",
      };
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roleId: newRoleId },
    include: { role: true },
  });

  // Ghi nhật ký kiểm toán Admin
  await prisma.adminAuditLog.create({
    data: {
      action: "UPDATE_USER_ROLE",
      recordsAffected: 1,
      details: {
        targetUserId: userId,
        targetEmail: targetUser.email,
        oldRole: targetUser.role.code,
        newRole: updated.role.code,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true, user: updated };
}

/**
 * Khóa hoặc mở khóa tài khoản người dùng
 */
export async function toggleUserStatus(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return { success: false, error: "Bạn không thể tự khóa tài khoản của chính mình." };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !targetUser.isActive },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: updated.isActive ? "ACTIVATE_USER" : "SUSPEND_USER",
      recordsAffected: 1,
      details: {
        targetUserId: userId,
        targetEmail: targetUser.email,
        newStatus: updated.isActive,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true, isActive: updated.isActive };
}

/**
 * Gán quyền ghi đè tùy biến (User Custom Permission Override)
 */
export async function setUserCustomPermission(params: {
  userId: string;
  permissionId: string;
  isGranted: boolean;
  reason?: string;
}) {
  const admin = await requireAdmin();

  await prisma.userCustomPermission.upsert({
    where: {
      userId_permissionId: {
        userId: params.userId,
        permissionId: params.permissionId,
      },
    },
    update: {
      isGranted: params.isGranted,
      reason: params.reason || null,
    },
    create: {
      userId: params.userId,
      permissionId: params.permissionId,
      isGranted: params.isGranted,
      reason: params.reason || null,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "OVERRIDE_USER_PERMISSION",
      recordsAffected: 1,
      details: {
        userId: params.userId,
        permissionId: params.permissionId,
        isGranted: params.isGranted,
        reason: params.reason,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Xóa quyền tùy biến (Khôi phục quyền mặc định theo Role)
 */
export async function removeUserCustomPermission(userId: string, permissionId: string) {
  const admin = await requireAdmin();

  await prisma.userCustomPermission.deleteMany({
    where: {
      userId,
      permissionId,
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "RESET_USER_PERMISSION",
      recordsAffected: 1,
      details: {
        userId,
        permissionId,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Lấy cấu hình ma trận phân quyền hệ thống (Roles, Permissions, Features)
 */
export async function getAccessControlMatrix() {
  await requireAdmin();

  const [roles, permissions, features] = await Promise.all([
    prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { code: "asc" }],
    }),
    prisma.feature.findMany({
      include: {
        featurePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return { roles, permissions, features };
}

/**
 * Bật/tắt quyền cho Vai trò (Role)
 */
export async function toggleRolePermission(roleId: string, permissionId: string) {
  const admin = await requireAdmin();

  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: { roleId, permissionId },
    },
  });

  if (existing) {
    await prisma.rolePermission.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      action: "TOGGLE_ROLE_PERMISSION",
      recordsAffected: 1,
      details: {
        roleId,
        permissionId,
        granted: !existing,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true, granted: !existing };
}

/**
 * Bật/tắt trạng thái công khai của Tính năng (Cho phép Guest dùng)
 */
export async function toggleFeaturePublicStatus(featureId: string, isPublic: boolean) {
  const admin = await requireAdmin();

  const updated = await prisma.feature.update({
    where: { id: featureId },
    data: { isPublic },
  });

  await prisma.adminAuditLog.create({
    data: {
      action: "TOGGLE_FEATURE_PUBLIC",
      recordsAffected: 1,
      details: {
        featureId,
        code: updated.code,
        isPublic,
        performedBy: admin.email,
      },
    },
  });

  revalidatePath("/admin");
  return { success: true, isPublic: updated.isPublic };
}
