import { describe, it, expect } from "vitest";
import {
  customerSchema,
  planSchema,
  createSubscriptionSchema,
  usageRecordSchema,
  billingEventSchema,
} from "@/lib/validations";

describe("Zod Input Validation Suite", () => {
  it("should validate and accept correct customer payload", () => {
    const valid = {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      companyName: "Acme Cloud",
      contactNumber: "+1-555-9090",
      status: "ACTIVE" as const,
    };
    const res = customerSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("should reject customer with invalid email", () => {
    const invalid = {
      fullName: "Jane Doe",
      email: "not-an-email",
      companyName: "Acme Cloud",
    };
    const res = customerSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("should validate and accept plan payload", () => {
    const validPlan = {
      name: "Enterprise Pro",
      description: "Dedicated cluster with custom SLA and security",
      monthlyPrice: 999.0,
      annualPrice: 9990.0,
      billingInterval: "MONTHLY" as const,
      features: ["Custom SLA", "24/7 Phone Support", "Unlimited seats"],
      maxUsageLimit: 1000000,
      status: "ACTIVE" as const,
    };
    const res = planSchema.safeParse(validPlan);
    expect(res.success).toBe(true);
  });

  it("should reject plan with negative price or empty features", () => {
    const invalidPlan = {
      name: "Invalid",
      description: "Short",
      monthlyPrice: -50,
      annualPrice: 500,
      features: [],
      maxUsageLimit: 100,
    };
    const res = planSchema.safeParse(invalidPlan);
    expect(res.success).toBe(false);
  });

  it("should reject usage record with non-positive amount", () => {
    const invalid = {
      subscriptionId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      customerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      metricType: "API_REQUESTS" as const,
      amount: -10,
    };
    const res = usageRecordSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("should validate billing event simulation payload", () => {
    const valid = {
      customerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      eventType: "PAYMENT_SUCCESS" as const,
      amount: 149.0,
      currency: "USD",
      paymentMethod: "pm_card_visa",
      idempotencyKey: "test_key_unique_12345",
    };
    const res = billingEventSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });
});
