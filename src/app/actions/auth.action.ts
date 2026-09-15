"use server";

import prisma from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  name: z.string().min(1, "Vui lòng nhập họ và tên").optional(),
});

const LoginSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function registerAction(data: {
  email: string;
  password: string;
  name?: string;
}) {
  try {
    const validated = RegisterSchema.parse(data);

    // 1. Kiểm tra email trùng lặp
    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existing) {
      return { success: false, error: "Email này đã được đăng ký trên hệ thống." };
    }

    // 2. Lấy role mặc định 'normal'
    let normalRole = await prisma.role.findUnique({
      where: { code: "normal" },
    });

    if (!normalRole) {
      normalRole = await prisma.role.create({
        data: {
          code: "normal",
          name: "Người dùng tiêu chuẩn",
          description: "Vai trò mặc định cho tài khoản đăng ký mới",
          isSystem: true,
        },
      });
    }

    // 3. Hash mật khẩu
    const passwordHash = await hashPassword(validated.password);

    // 4. Tạo User
    const newUser = await prisma.user.create({
      data: {
        email: validated.email.toLowerCase().trim(),
        name: validated.name?.trim() || null,
        passwordHash,
        roleId: normalRole.id,
        isActive: true,
      },
      include: { role: true },
    });

    // 5. Khởi tạo session cookie
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role.code,
      name: newUser.name,
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role.code,
      },
    };
  } catch (error: unknown) {
    console.error("Lỗi registerAction:", error);
    const msg =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : error instanceof Error
        ? error.message
        : "Đăng ký không thành công.";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function loginAction(data: { email: string; password: string }) {
  try {
    const validated = LoginSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
      include: { role: true },
    });

    if (!user) {
      return { success: false, error: "Email hoặc mật khẩu không chính xác." };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.",
      };
    }

    const isMatch = await verifyPassword(validated.password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Email hoặc mật khẩu không chính xác." };
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role.code,
      name: user.name,
    });

    await setSessionCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.code,
      },
    };
  } catch (error: unknown) {
    console.error("Lỗi loginAction:", error);
    const msg =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : error instanceof Error
        ? error.message
        : "Đăng nhập không thành công.";
    return {
      success: false,
      error: msg,
    };
  }
}

export async function logoutAction() {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (error: unknown) {
    console.error("Lỗi logoutAction:", error);
    const msg = error instanceof Error ? error.message : "Đăng xuất thất bại";
    return { success: false, error: msg };
  }
}

export async function getAuthStatusAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { isAuthenticated: false, user: null };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.code,
        roleName: user.role.name,
      },
    };
  } catch (error: unknown) {
    console.error("Lỗi getAuthStatusAction:", error);
    return { isAuthenticated: false, user: null };
  }
}
