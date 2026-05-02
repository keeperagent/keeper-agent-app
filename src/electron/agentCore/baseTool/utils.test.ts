import { describe, it, expect } from "vitest";
import _ from "lodash";
import { redistributeToCapacity } from "./utils";

describe("redistributeToCapacity", () => {
  it("returns planned as-is when no wallet exceeds capacity and sum equals targetTotal", () => {
    const result = redistributeToCapacity([30, 30, 30], [50, 50, 50], 90);
    expect(result).toHaveLength(3);
    expect(_.sum(result)).toBeCloseTo(90, 10);
    result.forEach((value) => {
      expect(value).toBeCloseTo(30, 10);
    });
  });

  it("clamps wallet that exceeds capacity and redistributes deficit to wallets with remaining capacity", () => {
    // wallet 0 planned=60 but capacity=40 → clamped to 40, deficit=20 shifts to wallets 1 & 2
    // wallets 1 & 2: planned=30, capacity=60 each → remaining=30 each → fills +10 each
    const result = redistributeToCapacity([60, 30, 30], [40, 60, 60], 120);
    expect(result).toHaveLength(3);
    expect(_.sum(result)).toBeCloseTo(120, 10);
    expect(result[0]).toBeCloseTo(40, 10);
    expect(result[1]).toBeCloseTo(40, 10);
    expect(result[2]).toBeCloseTo(40, 10);
  });

  it("redistributes deficit proportionally into remaining capacity after clamping", () => {
    // Both wallets at planned=their capacity, sum=80, deficit=20
    // wallet 0 remaining=20, wallet 1 remaining=0 → deficit goes entirely to wallet 0
    const result = redistributeToCapacity([30, 50], [50, 50], 100);
    expect(result).toHaveLength(2);
    expect(_.sum(result)).toBeCloseTo(100, 10);
    expect(result[0]).toBeCloseTo(50, 10); // fills up to capacity
    expect(result[1]).toBeCloseTo(50, 10);
  });

  it("stops at total capacity when all wallets are full and deficit cannot be filled", () => {
    // planned=capped to available=50+50=100; targetTotal=200 → deficit=100 but no remaining capacity
    const result = redistributeToCapacity([50, 50], [50, 50], 200);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(50, 10);
    expect(result[1]).toBeCloseTo(50, 10);
    expect(_.sum(result)).toBeCloseTo(100, 10); // cannot exceed total capacity
  });

  it("fills up to total available when targetTotal exceeds sum of all capacity", () => {
    // planned=[10,10], available=[30,30], targetTotal=150 → deficit=130 but only 40 remaining capacity
    const result = redistributeToCapacity([10, 10], [30, 30], 150);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(30, 10);
    expect(result[1]).toBeCloseTo(30, 10);
    expect(_.sum(result)).toBeCloseTo(60, 10); // max achievable = 30+30
  });

  it("handles single wallet with no deficit", () => {
    // targetTotal = sum(planned) = 20, no clamping, no deficit
    const result = redistributeToCapacity([20], [100], 20);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeCloseTo(20, 10);
  });

  it("handles single wallet where planned exceeds capacity", () => {
    const result = redistributeToCapacity([80], [50], 50);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeCloseTo(50, 10);
  });

  it("distributes proportionally when all planned amounts are zero", () => {
    // planned=[0,0,0], available=[50,50,50], targetTotal=90
    // deficit=90, remaining=[50,50,50], fills proportionally
    const result = redistributeToCapacity([0, 0, 0], [50, 50, 50], 90);
    expect(result).toHaveLength(3);
    expect(_.sum(result)).toBeCloseTo(90, 10);
    result.forEach((value) => {
      expect(value).toBeCloseTo(30, 10); // equal split since equal capacity
    });
  });

  it("distributes deficit proportionally based on remaining capacity", () => {
    // wallet 0: planned=0, available=60 → remaining=60
    // wallet 1: planned=40, available=40 → remaining=0
    // deficit=60, all goes to wallet 0
    const result = redistributeToCapacity([0, 40], [60, 40], 100);
    expect(result).toHaveLength(2);
    expect(_.sum(result)).toBeCloseTo(100, 10);
    expect(result[0]).toBeCloseTo(60, 10);
    expect(result[1]).toBeCloseTo(40, 10);
  });

  it("skips wallet with zero capacity and shifts its share to wallets that have capacity", () => {
    // wallet 0: capacity=0 → clamped to 0, deficit=30 shifts entirely to wallet 1
    const result = redistributeToCapacity([30, 30], [0, 60], 60);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(0, 10);
    expect(result[1]).toBeCloseTo(60, 10);
    expect(_.sum(result)).toBeCloseTo(60, 10);
  });

  it("handles empty arrays", () => {
    const result = redistributeToCapacity([], [], 0);
    expect(result).toEqual([]);
  });
});
