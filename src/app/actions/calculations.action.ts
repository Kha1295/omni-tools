"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

export interface SaveCalculationPayload {
  toolId: string;
  title: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
}

export interface SaveCalculationResponse {
  success: boolean;
  shareSlug?: string;
  shareUrl?: string;
  id?: string;
  error?: string;
}

export async function saveCalculationAction(
  payload: SaveCalculationPayload
): Promise<SaveCalculationResponse> {
  try {
    const { toolId, title, inputData, resultData } = payload;

    if (!toolId || !title) {
      return { success: false, error: "Thiếu thông tin công cụ hoặc tiêu đề" };
    }

    // Ước tính kích thước dữ liệu (bytes)
    const jsonString = JSON.stringify({ inputData, resultData });
    const dataSizeBytes = Buffer.byteLength(jsonString, "utf8");

    // Sinh slug ngắn gọn 9 ký tự an toàn URL
    const slug = nanoid(9);

    const record = await prisma.savedCalculation.create({
      data: {
        toolId,
        title: title.slice(0, 150),
        inputData: inputData as Prisma.InputJsonValue,
        resultData: resultData as Prisma.InputJsonValue,
        shareSlug: slug,
        isPublic: true,
        isStarred: false,
        viewCount: 0,
        dataSizeBytes,
      },
    });

    return {
      success: true,
      id: record.id,
      shareSlug: record.shareSlug,
      shareUrl: `/share/${record.shareSlug}`,
    };
  } catch (error: unknown) {
    console.error("Lỗi khi lưu kết quả tính toán:", error);
    const msg = error instanceof Error ? error.message : "Không thể lưu kết quả tính toán vào cơ sở dữ liệu";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function getCalculationBySlug(slug: string) {
  try {
    if (!slug) return null;

    // Tìm bản ghi và tăng lượt xem lên 1
    const record = await prisma.savedCalculation.update({
      where: { shareSlug: slug },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return {
      id: record.id,
      toolId: record.toolId,
      title: record.title,
      inputData: record.inputData as Record<string, unknown>,
      resultData: record.resultData as Record<string, unknown>,
      shareSlug: record.shareSlug,
      isStarred: record.isStarred,
      viewCount: record.viewCount,
      dataSizeBytes: record.dataSizeBytes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error(`Không tìm thấy bản ghi với slug ${slug}:`, error);
    return null;
  }
}

export async function toggleStarCalculationAction(id: string) {
  try {
    const record = await prisma.savedCalculation.findUnique({
      where: { id },
      select: { isStarred: true },
    });

    if (!record) return { success: false, error: "Bản ghi không tồn tại" };

    const updated = await prisma.savedCalculation.update({
      where: { id },
      data: { isStarred: !record.isStarred },
    });

    return { success: true, isStarred: updated.isStarred };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi khi cập nhật star";
    return { success: false, error: msg };
  }
}

export async function deleteCalculationAction(id: string) {
  try {
    const deleted = await prisma.savedCalculation.delete({
      where: { id },
    });

    // Ghi log kiểm toán
    await prisma.adminAuditLog.create({
      data: {
        action: "DELETE_SINGLE",
        recordsAffected: 1,
        bytesFreed: deleted.dataSizeBytes,
        details: { deletedId: id, toolId: deleted.toolId },
      },
    });

    return { success: true, bytesFreed: deleted.dataSizeBytes };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi khi xóa bản ghi";
    return { success: false, error: msg };
  }
}
