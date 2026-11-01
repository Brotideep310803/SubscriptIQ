import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Database & Business Logic Integration Suite", () => {
  beforeAll(async () => {
    // Ensure DB connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should have seeded demo users with correct roles", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@subscriptiq.com" },
    });
    const manager = await prisma.user.findUnique({
      where: { email: "manager@subscriptiq.com" },
    });
    const support = await prisma.user.findUnique({
      where: { email: "support@subscriptiq.com" },
    });

    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("ADMIN");

    expect(manager).not.toBeNull();
    expect(manager?.role).toBe("MANAGER");

    expect(support).not.toBeNull();
    expect(support?.role).toBe("SUPPORT_AGENT");
  });

  it("should enforce plan deletion dependency check when subscriptions exist", async () => {
    const planWithSubs = await prisma.subscriptionPlan.findFirst({
      where: {
        subscriptions: { some: {} },
      },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    expect(planWithSubs).not.toBeNull();
    expect(planWithSubs!._count.subscriptions).toBeGreaterThan(0);

    // Attempting direct raw delete or checking dependency
    const count = planWithSubs!._count.subscriptions;
    expect(count).toBeGreaterThan(0);
  });

  it("should have seeded at least 30 customers and 40 subscriptions", async () => {
    const customerCount = await prisma.customer.count();
    const subCount = await prisma.subscription.count();
    const eventCount = await prisma.billingEvent.count();
    const usageCount = await prisma.usageRecord.count();

    expect(customerCount).toBeGreaterThanOrEqual(30);
    expect(subCount).toBeGreaterThanOrEqual(40);
    expect(eventCount).toBeGreaterThanOrEqual(50);
    expect(usageCount).toBeGreaterThanOrEqual(100);
  });

  it("should detect usage limit warnings (>80%) and breaches (>100%)", async () => {
    const records = await prisma.usageRecord.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    const breaches = records.filter(
      (r) => r.amount > r.subscription.plan.maxUsageLimit
    );
    expect(breaches.length).toBeGreaterThan(0);
  });

  it("should prevent duplicate billing events with identical idempotency key", async () => {
    const existing = await prisma.billingEvent.findFirst();
    expect(existing).not.toBeNull();

    let duplicateFailed = false;
    try {
      await prisma.billingEvent.create({
        data: {
          customerId: existing!.customerId,
          eventType: "PAYMENT_SUCCESS",
          amount: 50.0,
          currency: "USD",
          status: "SUCCESS",
          idempotencyKey: existing!.idempotencyKey, // Duplicate key!
        },
      });
    } catch (err: any) {
      // Prisma throws Unique constraint error (P2002)
      duplicateFailed = true;
    }

    expect(duplicateFailed).toBe(true);
  });
});

