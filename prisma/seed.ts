import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu RBAC & PBAC...");

  // 1. Tạo các Vai trò hệ thống (Roles)
  const rolesData = [
    {
      code: "admin",
      name: "Quản trị viên tối cao",
      description: "Có toàn quyền cấu hình, phân quyền, quản lý user và dọn rác hệ thống.",
      isSystem: true,
    },
    {
      code: "normal",
      name: "Người dùng tiêu chuẩn",
      description: "Vai trò mặc định cho tài khoản đăng ký mới. Lưu lịch sử lên cloud, xuất dữ liệu cá nhân.",
      isSystem: true,
    },
    {
      code: "vip_member",
      name: "Thành viên VIP / Chuyên sâu",
      description: "Thành viên nâng cao, được phép xuất báo cáo PDF và các công cụ mở rộng.",
      isSystem: false,
    },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
  }
  console.log("✅ Khởi tạo Roles thành công.");

  // 2. Tạo các Quyền hạn chi tiết (Permissions)
  const permissionsData = [
    // Phân hệ Công cụ (tool)
    { code: "tool:calculate", name: "Tính toán công cụ", category: "tool", description: "Sử dụng các công cụ tính toán" },
    { code: "tool:history_view", name: "Xem lịch sử cá nhân", category: "tool", description: "Xem nhật ký tính toán đã lưu trên cloud" },
    { code: "tool:history_delete", name: "Xóa lịch sử cá nhân", category: "tool", description: "Xóa bản ghi nhật ký cá nhân" },
    { code: "tool:bookmark", name: "Ghim công cụ yêu thích", category: "tool", description: "Lưu công cụ và thông số cấu hình yêu thích" },
    // Phân hệ Xuất dữ liệu (export)
    { code: "tool:export_csv", name: "Xuất dữ liệu CSV", category: "export", description: "Xuất lịch sử và kết quả ra file CSV" },
    { code: "tool:export_json", name: "Xuất dữ liệu JSON", category: "export", description: "Xuất kết quả cấu trúc JSON thô" },
    { code: "tool:export_pdf", name: "Xuất báo cáo PDF", category: "export", description: "Xuất báo cáo định dạng PDF chuyên nghiệp" },
    // Phân hệ Quản trị (admin)
    { code: "admin:access", name: "Truy cập Admin Panel", category: "admin", description: "Được phép vào trang quản trị /admin" },
    { code: "admin:vacuum", name: "Dọn dẹp rác hệ thống", category: "admin", description: "Chạy tác vụ dọn dẹp và tối ưu dung lượng DB" },
    { code: "admin:users_manage", name: "Quản lý người dùng", category: "admin", description: "Xem danh sách, phân vai trò và khóa tài khoản" },
    { code: "admin:rbac_config", name: "Cấu hình phân quyền PBAC", category: "admin", description: "Thiết lập quyền tùy biến cho người dùng và tính năng" },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, category: p.category, description: p.description },
      create: p,
    });
  }
  console.log("✅ Khởi tạo Permissions thành công.");

  // 3. Gán Quyền mặc định cho từng Role (RolePermission)
  const roleAdmin = await prisma.role.findUnique({ where: { code: "admin" } });
  const roleNormal = await prisma.role.findUnique({ where: { code: "normal" } });
  const roleVip = await prisma.role.findUnique({ where: { code: "vip_member" } });
  const allPermissions = await prisma.permission.findMany();

  if (roleAdmin && roleNormal && roleVip) {
    // Admin: Tất cả permissions
    for (const p of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roleAdmin.id, permissionId: p.id } },
        update: {},
        create: { roleId: roleAdmin.id, permissionId: p.id },
      });
    }

    // Normal: Quyền công cụ cơ bản + xuất CSV + JSON
    const normalCodes = [
      "tool:calculate",
      "tool:history_view",
      "tool:history_delete",
      "tool:bookmark",
      "tool:export_csv",
      "tool:export_json",
    ];
    for (const code of normalCodes) {
      const p = allPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleNormal.id, permissionId: p.id } },
          update: {},
          create: { roleId: roleNormal.id, permissionId: p.id },
        });
      }
    }

    // VIP: Normal + PDF export
    const vipCodes = [...normalCodes, "tool:export_pdf"];
    for (const code of vipCodes) {
      const p = allPermissions.find((perm) => perm.code === code);
      if (p) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleVip.id, permissionId: p.id } },
          update: {},
          create: { roleId: roleVip.id, permissionId: p.id },
        });
      }
    }
  }
  console.log("✅ Gán RolePermission thành công.");

  // 4. Khởi tạo Ma trận Tính năng (Features & PBAC Mappings)
  const featuresData = [
    {
      code: "tool_calculation",
      name: "Tính toán công cụ tiện ích",
      description: "Cho phép thực hiện tính toán tài chính và tiện ích công cụ",
      isPublic: true, // Mở hoàn toàn cho Guest không cần đăng nhập
      requiredPerms: ["tool:calculate"],
    },
    {
      code: "export_csv",
      name: "Xuất dữ liệu ra file CSV",
      description: "Tải xuống bảng tính dữ liệu CSV",
      isPublic: false,
      requiredPerms: ["tool:export_csv"],
    },
    {
      code: "export_json",
      name: "Xuất cấu trúc dữ liệu JSON",
      description: "Tải xuống payload JSON cấu trúc",
      isPublic: false,
      requiredPerms: ["tool:export_json"],
    },
    {
      code: "export_pdf",
      name: "Xuất báo cáo PDF",
      description: "Tải báo cáo PDF chuyên nghiệp (VIP)",
      isPublic: false,
      requiredPerms: ["tool:export_pdf"],
    },
    {
      code: "admin_panel",
      name: "Bảng điều khiển Quản trị & Dọn rác",
      description: "Dọn dẹp rác hệ thống và quản trị phân quyền người dùng",
      isPublic: false,
      requiredPerms: ["admin:access"],
    },
  ];

  for (const f of featuresData) {
    const feature = await prisma.feature.upsert({
      where: { code: f.code },
      update: { name: f.name, description: f.description, isPublic: f.isPublic },
      create: {
        code: f.code,
        name: f.name,
        description: f.description,
        isPublic: f.isPublic,
      },
    });

    for (const reqCode of f.requiredPerms) {
      const p = allPermissions.find((perm) => perm.code === reqCode);
      if (p) {
        await prisma.featurePermission.upsert({
          where: { featureId_permissionId: { featureId: feature.id, permissionId: p.id } },
          update: {},
          create: { featureId: feature.id, permissionId: p.id },
        });
      }
    }
  }
  console.log("✅ Khởi tạo PBAC Features thành công.");

  // 5. Khởi tạo Tài khoản Admin Mặc định
  const defaultAdminEmail = "admin@omni.tools";
  const defaultAdminPass = "Admin@123456";
  const adminRole = await prisma.role.findUnique({ where: { code: "admin" } });

  if (adminRole) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultAdminPass, salt);

    const adminUser = await prisma.user.upsert({
      where: { email: defaultAdminEmail },
      update: {
        roleId: adminRole.id,
        isActive: true,
      },
      create: {
        email: defaultAdminEmail,
        name: "Quản Trị Viên Hệ Thống",
        passwordHash,
        roleId: adminRole.id,
        isActive: true,
      },
    });

    console.log(`✅ Khởi tạo Admin User: ${adminUser.email} (Mật khẩu: ${defaultAdminPass})`);
  }

  console.log("🚀 Hoàn tất Seed RBAC & PBAC Data!");
}

main()
  .catch((e) => {
    console.error("Lỗi seed data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

