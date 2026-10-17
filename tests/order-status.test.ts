import { describe, expect, it } from "vitest";
import { canTransition, isReturnable, CUSTOMER_CANCELLABLE } from "@/app/lib/order-status";

describe("canTransition", () => {
  it("allows moving forward, including skipping steps", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("rejects moving backwards or staying put", () => {
    expect(canTransition("SHIPPED", "PROCESSING")).toBe(false);
    expect(canTransition("DELIVERED", "DELIVERED")).toBe(false);
  });

  it("only cancels orders that haven't been delivered", () => {
    expect(canTransition("OUT_FOR_DELIVERY", "CANCELLED")).toBe(true);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "CANCELLED")).toBe(false);
  });

  it("refunds only delivered or cancelled orders", () => {
    expect(canTransition("DELIVERED", "REFUNDED")).toBe(true);
    expect(canTransition("CANCELLED", "REFUNDED")).toBe(true);
    expect(canTransition("SHIPPED", "REFUNDED")).toBe(false);
  });

  it("lets customers cancel only before shipping", () => {
    expect(CUSTOMER_CANCELLABLE).toEqual(["PENDING", "CONFIRMED", "PROCESSING"]);
  });
});

describe("isReturnable", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  it("allows returns inside the window", () => {
    expect(isReturnable("DELIVERED", new Date("2026-10-12T12:00:00Z"), 7, now)).toBe(true);
  });
  it("refuses after the window or before delivery", () => {
    expect(isReturnable("DELIVERED", new Date("2026-10-01T12:00:00Z"), 7, now)).toBe(false);
    expect(isReturnable("SHIPPED", null, 7, now)).toBe(false);
  });
});
