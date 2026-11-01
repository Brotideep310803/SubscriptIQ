import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const customerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Valid email is required"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(100),
  contactNumber: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "CHURNED"]).default("ACTIVE"),
});

export const updateCustomerSchema = customerSchema.partial();

export const planSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters").max(50),
  description: z.string().min(5, "Description must be at least 5 characters").max(500),
  monthlyPrice: z.number().min(0, "Monthly price must be positive"),
  annualPrice: z.number().min(0, "Annual price must be positive"),
  billingInterval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  maxUsageLimit: z.number().int().positive("Usage limit must be a positive integer"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const updatePlanSchema = planSchema.partial();

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  planId: z.string().uuid("Invalid plan ID"),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  status: z.enum(["ACTIVE", "TRIALING", "CANCELLED", "PAST_DUE", "EXPIRED"]).default("ACTIVE"),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional(),
  status: z.enum(["ACTIVE", "TRIALING", "CANCELLED", "PAST_DUE", "EXPIRED"]).optional(),
  renewalDate: z.string().datetime().optional(),
});

export const usageRecordSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  customerId: z.string().uuid("Invalid customer ID"),
  metricType: z.enum(["API_REQUESTS", "STORAGE_MB", "ACTIVE_USERS", "TRANSACTIONS"]),
  amount: z.number().int().positive("Amount must be a positive integer"),
  notes: z.string().max(255).optional().nullable(),
});

export const billingEventSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  invoiceId: z.string().uuid().optional().nullable(),
  eventType: z.enum(["PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_REFUNDED", "PAYMENT_PENDING"]),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.string().default("USD"),
  paymentMethod: z.string().default("pm_card_visa"),
  failureReason: z.string().optional().nullable(),
  idempotencyKey: z.string().min(5, "Idempotency key required"),
});
