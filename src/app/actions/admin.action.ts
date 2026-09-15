"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";

export interface ToolStorageStat {
  toolId: string;
  name: string;
  count: number;
  totalBytes: number;
  totalViews: number;
  percentage: number;
}

export interface DailyActivityStat {
  date: string;
  count: number;
  bytes: number;
}

export interface AdminDashboardStats {
  totalRecords: number;
  totalBytes: number;
  totalViews: number;
  starredCount: number;
  junkCandidateCount: number;
  junkCandidateBytes: number;
  storageLimitBytes: number; // 500MB Supabase Free Tier = 524,288,000 bytes
  storageUsagePercent: number;
  toolsBreakdown: ToolStorageStat[];
  recentDailyStats: DailyActivityStat[];
  recentLogs: {
    id: string;
    action: string;
    recordsAffected: number;
    bytesFreed: number;
    createdAt: string;
  }[];
}

const TOOL_NAMES: Record<string, string> = {
  "loan-calculator": "Tính Lãi Vay Ngân Hàng",
  "bill-split": "Chia Tiền Hóa Đơn (Bill Split)",
  "interest-rate": "Tính Lãi Suất & Lãi Kép",
  "currency-converter": "Quy Đổi Ngoại Tệ",
};

export async function getAdminStatsAction(): Promise<AdminDashboardStats> {
  try {
    await requireAdmin();
    const totalRecords = await prisma.savedCalculation.count();
    const starredCount = await prisma.savedCalculation.count({ where: { isStarred: true } });
    
    // Tổng số lượt xem và tổng dung lượng
    const aggregation = await prisma.savedCalculation.aggregate({
      _sum: {
        dataSizeBytes: true,
        viewCount: true,
      },
    });

    const totalBytes = aggregation._sum.dataSizeBytes || 0;
    const totalViews = aggregation._sum.viewCount || 0;

    // Hạn mức Free Tier của Supabase: 500 MB (500 * 1024 * 1024 bytes)
    const storageLimitBytes = 500 * 1024 * 1024;
    const storageUsagePercent = Number(((totalBytes / storageLimitBytes) * 100).toFixed(4));

    // Thống kê dữ liệu rác tiềm năng:
    // Bản ghi KHÔNG có Star VÀ (được tạo trước 30 ngày HOẶC 0 lượt xem)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const junkAggregation = await prisma.savedCalculation.aggregate({
      where: {
        isStarred: false,
        OR: [
          { createdAt: { lt: thirtyDaysAgo } },
          { viewCount: 0 },
        ],
      },
      _count: { id: true },
      _sum: { dataSizeBytes: true },
    });

    const junkCandidateCount = junkAggregation._count.id || 0;
    const junkCandidateBytes = junkAggregation._sum.dataSizeBytes || 0;

    // Phân bổ theo từng Tool
    const groupByTool = await prisma.savedCalculation.groupBy({
      by: ["toolId"],
      _count: { id: true },
      _sum: {
        dataSizeBytes: true,
        viewCount: true,
      },
    });

    const toolsBreakdown: ToolStorageStat[] = groupByTool.map((item) => {
      const bytes = item._sum.dataSizeBytes || 0;
      return {
        toolId: item.toolId,
        name: TOOL_NAMES[item.toolId] || item.toolId,
        count: item._count.id,
        totalBytes: bytes,
        totalViews: item._sum.viewCount || 0,
        percentage: totalBytes > 0 ? Number(((bytes / totalBytes) * 100).toFixed(1)) : 0,
      };
    });

    // Thống kê 7 ngày gần đây
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentRecords = await prisma.savedCalculation.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, dataSizeBytes: true },
    });

    const dailyMap: Record<string, { count: number; bytes: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dailyMap[dateStr] = { count: 0, bytes: 0 };
    }

    recentRecords.forEach((r) => {
      const dateStr = r.createdAt.toISOString().split("T")[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].count += 1;
        dailyMap[dateStr].bytes += r.dataSizeBytes;
      }
    });

    const recentDailyStats: DailyActivityStat[] = Object.entries(dailyMap).map(
      ([date, data]) => ({
        date,
        count: data.count,
        bytes: data.bytes,
      })
    );

    // Lịch sử kiểm toán gần đây
    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      recordsAffected: log.recordsAffected,
      bytesFreed: log.bytesFreed,
      createdAt: log.createdAt.toISOString(),
    }));

    return {
      totalRecords,
      totalBytes,
      totalViews,
      starredCount,
      junkCandidateCount,
      junkCandidateBytes,
      storageLimitBytes,
      storageUsagePercent,
      toolsBreakdown,
      recentDailyStats,
      recentLogs,
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông số thống kê Admin:", error);
    return {
      totalRecords: 0,
      totalBytes: 0,
      totalViews: 0,
      starredCount: 0,
      junkCandidateCount: 0,
      junkCandidateBytes: 0,
      storageLimitBytes: 500 * 1024 * 1024,
      storageUsagePercent: 0,
      toolsBreakdown: [],
      recentDailyStats: [],
      recentLogs: [],
    };
  }
}

import { Prisma } from "@prisma/client";

export interface QueryCalculationsParams {
  page?: number;
  pageSize?: number;
  toolFilter?: string;
  search?: string;
  starredOnly?: boolean;
}

export async function getCalculationsTableAction(params: QueryCalculationsParams) {
  try {
    await requireAdmin();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(5, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.SavedCalculationWhereInput = {};
    if (params.toolFilter && params.toolFilter !== "all") {
      where.toolId = params.toolFilter;
    }
    if (params.starredOnly) {
      where.isStarred = true;
    }
    if (params.search && params.search.trim()) {
      where.OR = [
        { title: { contains: params.search.trim(), mode: "insensitive" } },
        { shareSlug: { contains: params.search.trim(), mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.savedCalculation.count({ where }),
      prisma.savedCalculation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      records: records.map((r) => ({
        id: r.id,
        toolId: r.toolId,
        toolName: TOOL_NAMES[r.toolId] || r.toolId,
        title: r.title,
        shareSlug: r.shareSlug,
        isStarred: r.isStarred,
        viewCount: r.viewCount,
        dataSizeBytes: r.dataSizeBytes,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (error: unknown) {
    console.error("Lỗi khi lấy danh sách tính toán:", error);
    const msg = error instanceof Error ? error.message : "Lỗi khi truy vấn danh sách";
    return {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      records: [],
      error: msg,
    };
  }
}

export interface CleanupCriteria {
  type: "older_than_days" | "zero_views" | "all_unstarred";
  days?: number;
}

export async function cleanupJunkDataAction(criteria: CleanupCriteria) {
  try {
    await requireAdmin();
    const where: Prisma.SavedCalculationWhereInput = {
      isStarred: false, // TUYỆT ĐỐI BẢO VỆ CÁC BẢN GHI ĐƯỢC ĐÁNH SAO
    };

    let actionLabel = "";
    if (criteria.type === "older_than_days") {
      const days = criteria.days || 30;
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      where.createdAt = { lt: threshold };
      actionLabel = `CLEANUP_OLDER_THAN_${days}_DAYS`;
    } else if (criteria.type === "zero_views") {
      where.viewCount = 0;
      actionLabel = "CLEANUP_ZERO_VIEWS";
    } else if (criteria.type === "all_unstarred") {
      actionLabel = "CLEANUP_ALL_UNSTARRED";
    }

    // Tính tổng dung lượng sắp giải phóng trước khi xóa
    const agg = await prisma.savedCalculation.aggregate({
      where,
      _sum: { dataSizeBytes: true },
      _count: { id: true },
    });

    const bytesFreed = agg._sum.dataSizeBytes || 0;
    const recordsAffected = agg._count.id || 0;

    if (recordsAffected === 0) {
      return { success: true, count: 0, bytesFreed: 0, message: "Không tìm thấy dữ liệu rác phù hợp tiêu chí" };
    }

    // Thực hiện xóa
    await prisma.savedCalculation.deleteMany({ where });

    // Ghi nhật ký kiểm toán
    await prisma.adminAuditLog.create({
      data: {
        action: actionLabel,
        recordsAffected,
        bytesFreed,
        details: { criteria } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin");

    return {
      success: true,
      count: recordsAffected,
      bytesFreed,
      message: `Đã dọn dẹp thành công ${recordsAffected} bản ghi, giải phóng ${(bytesFreed / 1024).toFixed(1)} KB`,
    };
  } catch (error: unknown) {
    console.error("Lỗi khi dọn dẹp dữ liệu rác:", error);
    const msg = error instanceof Error ? error.message : "Lỗi trong quá trình dọn dẹp";
    return { success: false, error: msg };
  }
}

export async function bulkDeleteCalculationsAction(ids: string[]) {
  try {
    await requireAdmin();
    if (!ids || ids.length === 0) return { success: false, error: "Chưa chọn bản ghi nào" };

    const agg = await prisma.savedCalculation.aggregate({
      where: { id: { in: ids } },
      _sum: { dataSizeBytes: true },
      _count: { id: true },
    });

    const bytesFreed = agg._sum.dataSizeBytes || 0;
    const recordsAffected = agg._count.id || 0;

    await prisma.savedCalculation.deleteMany({
      where: { id: { in: ids } },
    });

    await prisma.adminAuditLog.create({
      data: {
        action: "BULK_DELETE",
        recordsAffected,
        bytesFreed,
        details: { ids } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin");

    return { success: true, count: recordsAffected, bytesFreed };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi khi xóa hàng loạt";
    return { success: false, error: msg };
  }
}

