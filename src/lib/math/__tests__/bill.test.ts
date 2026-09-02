import { describe, it, expect } from "vitest";
import { calculateBillSplit } from "../bill";

describe("Bill Splitter Math Core (calculateBillSplit)", () => {
  it("should calculate equal split correctly with tax and tip", () => {
    const result = calculateBillSplit({
      subtotal: 1200000,
      taxPercent: 10, // 120,000
      tipPercent: 5, // 60,000
      serviceChargePercent: 0,
      numberOfPeople: 4,
      splitMode: "equal",
    });

    expect(result.subtotal).toBe(1200000);
    expect(result.taxAmount).toBe(120000);
    expect(result.tipAmount).toBe(60000);
    expect(result.totalAmount).toBe(1380000);
    expect(result.perPersonTotal).toBe(345000);
    expect(result.roundedPerPersonTotal).toBe(345000);
  });

  it("should match user DEMO DATA for shares split (Total 2M, 10 shares, 12 people)", () => {
    // Data demo from user:
    // Total: 2,000,000.00
    // Số người: 12 (8 người 1 phần, 4 người 0.5 phần => 10 phần)
    // Tiền / phần: 200,000.00
    const demoPeople = [
      { id: "1", name: "Name 1", shares: 1 },
      { id: "2", name: "Name 2", shares: 1 },
      { id: "3", name: "Name 3", shares: 1 },
      { id: "4", name: "Name 4", shares: 1 },
      { id: "5", name: "Name 5", shares: 1 },
      { id: "6", name: "Name 6", shares: 1 },
      { id: "7", name: "Name 7", shares: 1 },
      { id: "8", name: "Name 8", shares: 1 },
      { id: "9", name: "Name 9", shares: 0.5 },
      { id: "10", name: "Name 10", shares: 0.5 },
      { id: "11", name: "Name 11", shares: 0.5 },
      { id: "12", name: "Name 12", shares: 0.5 },
    ];

    const result = calculateBillSplit({
      subtotal: 2000000,
      taxPercent: 0,
      tipPercent: 0,
      numberOfPeople: 10,
      splitMode: "shares",
      peopleShares: demoPeople,
    });

    expect(result.totalAmount).toBe(2000000);
    expect(result.totalShares).toBe(10);
    expect(result.pricePerShare).toBe(200000);
    expect(result.personDetails.length).toBe(12);

    // Verify 8 people with 1 share pay 200,000
    for (let i = 0; i < 8; i++) {
      expect(result.personDetails[i].shares).toBe(1);
      expect(result.personDetails[i].amount).toBe(200000);
      expect(result.personDetails[i].percentOfTotal).toBe(10);
    }

    // Verify 4 people with 0.5 shares pay 100,000
    for (let i = 8; i < 12; i++) {
      expect(result.personDetails[i].shares).toBe(0.5);
      expect(result.personDetails[i].amount).toBe(100000);
      expect(result.personDetails[i].percentOfTotal).toBe(5);
    }

    // Total sum of all people matches total amount
    const totalCollected = result.personDetails.reduce((sum, p) => sum + p.amount, 0);
    expect(totalCollected).toBe(2000000);
  });

  it("should handle rounding step accurately", () => {
    const result = calculateBillSplit({
      subtotal: 1000000,
      taxPercent: 10,
      tipPercent: 0,
      numberOfPeople: 3, // 1,100,000 / 3 = 366,666.67
      roundingStep: 1000, // Làm tròn hàng nghìn -> 367,000
    });

    expect(result.totalAmount).toBe(1100000);
    expect(result.roundedPerPersonTotal).toBe(367000);
  });
});
