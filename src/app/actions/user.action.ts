"use server";

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface LogToolUsageParams {
  toolId: string;
  title?: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  executionTimeMs?: number;
}

/**
 * Ghi lại lịch sử tính toán công cụ.
 * Nếu đã đăng nhập: Lưu vào Cloud Database (ToolLog).
 * Nếu là Khách: Trả về isGuest = true để Client lưu vào localStorage.
 */
export async function logToolUsageAction(params: LogToolUsageParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: true, isGuest: true };
    }

    const log = await prisma.toolLog.create({
      data: {
        userId: user.id,
        toolId: params.toolId,
        title: params.title || null,
        inputData: params.inputData as Prisma.InputJsonValue,
        resultData: params.resultData as Prisma.InputJsonValue,
        executionTimeMs: params.executionTimeMs || null,
      },
    });

    return { success: true, isGuest: false, logId: log.id };
  } catch (error: unknown) {
    console.error("Lỗi logToolUsageAction:", error);
    const msg = error instanceof Error ? error.message : "Lỗi ghi nhận lịch sử";
    return { success: false, error: msg };
  }
}

/**
 * Đồng bộ toàn bộ lịch sử Khách từ localStorage lên Cloud khi đăng ký / đăng nhập
 */
export async function syncGuestHistoryAction(
  guestLogs: Array<{
    toolId: string;
    title?: string;
    inputData: Record<string, unknown>;
    resultData: Record<string, unknown>;
    createdAt?: string;
  }>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Vui lòng đăng nhập để đồng bộ lịch sử." };
    }

    if (!guestLogs || guestLogs.length === 0) {
      return { success: true, count: 0 };
    }

    // Insert batch
    const dataToInsert = guestLogs.map((log) => ({
      userId: user.id,
      toolId: log.toolId,
      title: log.title || null,
      inputData: log.inputData as Prisma.InputJsonValue,
      resultData: log.resultData as Prisma.InputJsonValue,
      createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
    }));

    const result = await prisma.toolLog.createMany({
      data: dataToInsert,
    });

    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (error: unknown) {
    console.error("Lỗi syncGuestHistoryAction:", error);
    const msg = error instanceof Error ? error.message : "Lỗi đồng bộ lịch sử";
    return { success: false, error: msg };
  }
}

/**
 * Thống kê tổng quan cho trang User Dashboard
 */
export async function getUserDashboardStats() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const totalLogs = await prisma.toolLog.count({
      where: { userId: user.id },
    });

    const totalBookmarks = await prisma.userBookmark.count({
      where: { userId: user.id },
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyLogs = await prisma.toolLog.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Thống kê phân bổ theo công cụ
    const toolDistributionRaw = await prisma.toolLog.groupBy({
      by: ["toolId"],
      where: { userId: user.id },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const toolDistribution = toolDistributionRaw.map((item) => ({
      toolId: item.toolId,
      count: item._count.id,
    }));

    return {
      totalLogs,
      totalBookmarks,
      weeklyLogs,
      toolDistribution,
      userRole: user.role.name,
      userEmail: user.email,
      userName: user.name,
    };
  } catch (error: unknown) {
    console.error("Lỗi getUserDashboardStats:", error);
    return null;
  }
}

/**
 * Lấy danh sách nhật ký tính toán cá nhân (phân trang & bộ lọc)
 */
export async function getUserToolLogs(params: {
  toolId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized", data: [], total: 0 };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 15);
    const skip = (page - 1) * pageSize;

    const whereClause: Prisma.ToolLogWhereInput = { userId: user.id };
    if (params.toolId && params.toolId !== "all") {
      whereClause.toolId = params.toolId;
    }
    if (params.search) {
      whereClause.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { toolId: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.toolLog.count({ where: whereClause }),
      prisma.toolLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      success: true,
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error: unknown) {
    console.error("Lỗi getUserToolLogs:", error);
    const msg = error instanceof Error ? error.message : "Lỗi truy vấn lịch sử";
    return { success: false, error: msg, data: [], total: 0 };
  }
}

/**
 * Xóa một bản ghi nhật ký cá nhân
 */
export async function deleteToolLog(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const log = await prisma.toolLog.findUnique({ where: { id } });
    if (!log || log.userId !== user.id) {
      return { success: false, error: "Không tìm thấy bản ghi hoặc không có quyền xóa." };
    }

    await prisma.toolLog.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error("Lỗi deleteToolLog:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xóa bản ghi";
    return { success: false, error: msg };
  }
}

/**
 * Xóa toàn bộ lịch sử tính toán của user hiện tại
 */
export async function clearAllUserToolLogs() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await prisma.toolLog.deleteMany({
      where: { userId: user.id },
    });

    revalidatePath("/dashboard");
    return { success: true, count: result.count };
  } catch (error: unknown) {
    console.error("Lỗi clearAllUserToolLogs:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xóa toàn bộ lịch sử";
    return { success: false, error: msg };
  }
}

/**
 * Ghim / Bỏ ghim công cụ yêu thích (Bookmarks)
 */
export async function toggleBookmark(toolId: string, customTitle?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Vui lòng đăng nhập để ghim công cụ." };
    }

    const existing = await prisma.userBookmark.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId,
        },
      },
    });

    if (existing) {
      await prisma.userBookmark.delete({ where: { id: existing.id } });
      revalidatePath("/dashboard");
      return { success: true, isBookmarked: false };
    } else {
      await prisma.userBookmark.create({
        data: {
          userId: user.id,
          toolId,
          customTitle: customTitle || null,
        },
      });
      revalidatePath("/dashboard");
      return { success: true, isBookmarked: true };
    }
  } catch (error: unknown) {
    console.error("Lỗi toggleBookmark:", error);
    const msg = error instanceof Error ? error.message : "Lỗi ghim công cụ";
    return { success: false, error: msg };
  }
}

/**
 * Lấy danh sách bookmark của user
 */
export async function getUserBookmarks() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    return await prisma.userBookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: unknown) {
    console.error("Lỗi getUserBookmarks:", error);
    return [];
  }
}

