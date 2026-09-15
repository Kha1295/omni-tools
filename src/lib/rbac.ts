import prisma from "./db";
import { getCurrentUser } from "./auth";

/**
 * Lấy danh sách mã quyền hiệu lực (Effective Permissions) của một User:
 * Effective Permissions = (Role Permissions) UNION (Custom Grants) MINUS (Custom Revokes)
 * Nếu vai trò là "admin" thì có toàn quyền hệ thống.
 */
export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      customPermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return [];
  }

  // Quản trị viên tối cao: Tự động có toàn bộ quyền
  if (user.role.code === "admin") {
    const allPermissions = await prisma.permission.findMany({
      select: { code: true },
    });
    return allPermissions.map((p) => p.code);
  }

  // 1. Khởi tạo từ Role Permissions
  const permSet = new Set<string>();
  user.role.rolePermissions.forEach((rp) => {
    permSet.add(rp.permission.code);
  });

  // 2. Áp dụng User Custom Permissions (Overrides)
  user.customPermissions.forEach((cp) => {
    if (cp.isGranted) {
      permSet.add(cp.permission.code);
    } else {
      permSet.delete(cp.permission.code);
    }
  });

  return Array.from(permSet);
}

/**
 * Kiểm tra xem người dùng có quyền cụ thể hay không
 */
export async function hasPermission(
  userId: string | null | undefined,
  permissionCode: string
): Promise<boolean> {
  if (!userId) return false;

  const permissions = await getEffectivePermissions(userId);
  return permissions.includes(permissionCode);
}

/**
 * Kiểm tra xem người dùng (hoặc Guest vãng lai) có quyền truy cập một Tính năng (Feature) hay không
 * Hỗ trợ PBAC động dựa trên bảng Feature & FeaturePermission
 */
export async function canAccessFeature(
  userId: string | null | undefined,
  featureCode: string
): Promise<boolean> {
  const feature = await prisma.feature.findUnique({
    where: { code: featureCode },
    include: {
      featurePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  // Nếu tính năng không tồn tại trong cấu hình PBAC, cho phép truy cập mặc định
  if (!feature) {
    return true;
  }

  // Nếu tính năng được cấu hình là Công khai (isPublic = true) -> Khách và mọi người dùng đều dùng được
  if (feature.isPublic) {
    return true;
  }

  // Tính năng yêu cầu đăng nhập: Nếu chưa đăng nhập thì từ chối
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    return false;
  }

  // Admin luôn có toàn quyền
  if (user.role.code === "admin") {
    return true;
  }

  // Nếu tính năng không yêu cầu quyền hạn cụ thể nào, chỉ cần đăng nhập là được dùng
  if (feature.featurePermissions.length === 0) {
    return true;
  }

  // Kiểm tra quyền hiệu lực của người dùng
  const effectivePerms = await getEffectivePermissions(userId);
  const requiredPermCodes = feature.featurePermissions.map((fp) => fp.permission.code);

  // Người dùng phải sở hữu tất cả các quyền được yêu cầu cho tính năng này
  return requiredPermCodes.every((code) => effectivePerms.includes(code));
}

/**
 * Kiểm tra quyền Admin, ném lỗi hoặc trả về người dùng nếu hợp lệ
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role.code !== "admin") {
    throw new Error("403 Forbidden: Bạn không có quyền truy cập khu vực Quản trị viên.");
  }
  return user;
}
