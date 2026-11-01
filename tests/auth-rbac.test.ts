import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { createSessionToken, verifySessionToken, ROLE_PERMISSIONS, UserRole } from "@/lib/auth";

describe("Authentication & RBAC Suite", () => {
  it("should securely hash and verify user passwords with bcrypt", async () => {
    const password = "TestSecurePassword123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).not.toBe(password);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare("WrongPassword", hash);
    expect(wrongMatch).toBe(false);
  });

  it("should create and verify signed JWT session tokens", async () => {
    const payload = {
      userId: "test-user-uuid",
      email: "alexandra@subscriptiq.com",
      name: "Alexandra Vance",
      role: "ADMIN" as UserRole,
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe("ADMIN");
  });

  it("should reject invalid or tampered JWT session tokens", async () => {
    const tampered = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature";
    const decoded = await verifySessionToken(tampered);
    expect(decoded).toBeNull();
  });

  it("should enforce strict role-based permission matrix", () => {
    // Admin permissions
    expect(ROLE_PERMISSIONS.ADMIN.canManagePlans).toBe(true);
    expect(ROLE_PERMISSIONS.ADMIN.canSimulateBilling).toBe(true);
    expect(ROLE_PERMISSIONS.ADMIN.canViewAuditLogs).toBe(true);
    expect(ROLE_PERMISSIONS.ADMIN.canViewAnalytics).toBe(true);

    // Manager permissions
    expect(ROLE_PERMISSIONS.MANAGER.canViewAnalytics).toBe(true);
    expect(ROLE_PERMISSIONS.MANAGER.canViewAuditLogs).toBe(true);
    expect(ROLE_PERMISSIONS.MANAGER.canManagePlans).toBe(false);
    expect(ROLE_PERMISSIONS.MANAGER.canSimulateBilling).toBe(false);

    // Support Agent permissions
    expect(ROLE_PERMISSIONS.SUPPORT_AGENT.canManageCustomers).toBe(true);
    expect(ROLE_PERMISSIONS.SUPPORT_AGENT.canViewAnalytics).toBe(false);
    expect(ROLE_PERMISSIONS.SUPPORT_AGENT.canManagePlans).toBe(false);
    expect(ROLE_PERMISSIONS.SUPPORT_AGENT.canSimulateBilling).toBe(false);
    expect(ROLE_PERMISSIONS.SUPPORT_AGENT.canViewAuditLogs).toBe(false);
  });
});
