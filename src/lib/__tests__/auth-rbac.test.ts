import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../auth";

describe("Authentication & RBAC Logic", () => {
  it("should hash and verify passwords securely", async () => {
    const raw = "Admin@123456";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should sign and verify JWT session tokens", async () => {
    const payload = {
      userId: "usr_12345",
      email: "test@omni.tools",
      role: "normal",
      name: "Test User",
    };

    const token = await createSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
  });

  it("should reject invalid or tampered tokens", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature";
    const verified = await verifySessionToken(invalidToken);
    expect(verified).toBeNull();
  });

  it("calculates effective permissions correctly: (Role Permissions UNION Grants) MINUS Revokes", () => {
    const rolePermissions = ["tool:calculate", "tool:history_view", "tool:export_csv"];
    const customOverrides = [
      { code: "tool:export_pdf", isGranted: true }, // Extra grant
      { code: "tool:export_csv", isGranted: false }, // Explicit revoke
    ];

    const permSet = new Set(rolePermissions);
    customOverrides.forEach((cp) => {
      if (cp.isGranted) {
        permSet.add(cp.code);
      } else {
        permSet.delete(cp.code);
      }
    });

    const effective = Array.from(permSet);
    expect(effective).toContain("tool:calculate");
    expect(effective).toContain("tool:history_view");
    expect(effective).toContain("tool:export_pdf"); // Granted
    expect(effective).not.toContain("tool:export_csv"); // Revoked
  });
});

