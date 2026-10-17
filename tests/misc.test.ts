import { describe, expect, it } from "vitest";
import { normalizeNepaliPhone } from "@/app/lib/sms";
import { bucketByDay, pctChange, periodDays } from "@/app/lib/analytics";

describe("normalizeNepaliPhone", () => {
  it("accepts local and +977 mobile numbers", () => {
    expect(normalizeNepaliPhone("9841234567")).toBe("9841234567");
    expect(normalizeNepaliPhone("+977-984-1234567")).toBe("9841234567");
  });
  it("rejects landlines and junk", () => {
    expect(normalizeNepaliPhone("01-4412345")).toBeNull();
    expect(normalizeNepaliPhone("12345")).toBeNull();
  });
});

describe("analytics helpers", () => {
  it("fills every day in the window", () => {
    const now = new Date("2026-10-17T10:00:00");
    const rows = [
      { createdAt: new Date("2026-10-17T09:00:00"), total: 100 },
      { createdAt: new Date("2026-10-17T08:00:00"), total: 50 },
    ];
    const days = bucketByDay(rows, 7, (r) => r.total, now);
    expect(days).toHaveLength(7);
    expect(days.reduce((s, d) => s + d.revenue, 0)).toBe(150);
    expect(days.reduce((s, d) => s + d.orders, 0)).toBe(2);
  });

  it("only accepts known periods", () => {
    expect(periodDays("90")).toBe(90);
    expect(periodDays("13")).toBe(30);
    expect(periodDays(null)).toBe(30);
  });

  it("computes percentage change", () => {
    expect(pctChange(150, 100)).toBe(50);
    expect(pctChange(0, 0)).toBe(0);
    expect(pctChange(10, 0)).toBe(100);
  });
});
