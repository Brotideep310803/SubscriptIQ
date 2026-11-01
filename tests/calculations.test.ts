import { describe, it, expect } from "vitest";

describe("Analytics & KPI Calculation Formulas", () => {
  it("should accurately calculate Monthly Recurring Revenue (MRR) from mixed cycles", () => {
    // 2 Monthly plans at $149 each = $298
    // 1 Annual plan at $1,200/year = $100/mo
    const subscriptions = [
      { amount: 149, billingCycle: "MONTHLY", status: "ACTIVE" },
      { amount: 149, billingCycle: "MONTHLY", status: "ACTIVE" },
      { amount: 1200, billingCycle: "ANNUAL", status: "ACTIVE" },
      { amount: 999, billingCycle: "MONTHLY", status: "CANCELLED" }, // should not contribute
    ];

    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
    const mrr = activeSubs.reduce((acc, s) => {
      return acc + (s.billingCycle === "ANNUAL" ? s.amount / 12 : s.amount);
    }, 0);

    expect(mrr).toBe(398);
  });

  it("should calculate Annual Recurring Revenue (ARR) as exactly MRR * 12", () => {
    const mrr = 398;
    const arr = mrr * 12;
    expect(arr).toBe(4776);
  });

  it("should calculate Churn Rate correctly", () => {
    const activeAtStart = 100;
    const cancelledInPeriod = 5;

    const churnRate = (cancelledInPeriod / activeAtStart) * 100;
    expect(churnRate).toBe(5.0);
  });

  it("should calculate Customer Lifetime Value (LTV) from ARPU and Churn Rate", () => {
    const totalMRR = 10000;
    const customerCount = 50;
    const arpu = totalMRR / customerCount; // $200
    const churnRateDecimal = 0.05; // 5% monthly churn

    const ltv = arpu / churnRateDecimal; // 200 / 0.05 = 4000
    expect(arpu).toBe(200);
    expect(ltv).toBe(4000);
  });

  it("should calculate Payment Success Rate accurately", () => {
    const successfulEvents = 95;
    const failedEvents = 5;
    const totalEvents = successfulEvents + failedEvents;

    const successRate = (successfulEvents / totalEvents) * 100;
    expect(successRate).toBe(95.0);
  });
});
