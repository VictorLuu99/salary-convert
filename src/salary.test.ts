import { describe, expect, it } from "vitest";
import {
  calculateGrossToNet,
  calculateNetToGross,
  formatVnd,
  getInsuranceBase,
} from "./salary";

describe("salary calculator", () => {
  it("calculates 2026 gross to net with required deductions", () => {
    const result = calculateGrossToNet({
      grossSalary: 35_000_000,
      dependents: 2,
      region: "I",
      insuranceSalary: 35_000_000,
      insuranceContributionPercent: 100,
      applyInsuranceBounds: true,
    });

    expect(result.socialInsurance).toBe(2_800_000);
    expect(result.healthInsurance).toBe(525_000);
    expect(result.unemploymentInsurance).toBe(350_000);
    expect(result.familyDeduction).toBe(27_900_000);
    expect(result.taxableIncome).toBe(3_425_000);
    expect(result.personalIncomeTax).toBe(171_250);
    expect(result.netSalary).toBe(31_153_750);
  });

  it("supports custom insurance contribution percent", () => {
    const result = calculateGrossToNet({
      grossSalary: 35_000_000,
      dependents: 0,
      region: "I",
      insuranceSalary: 35_000_000,
      insuranceContributionPercent: 50,
      applyInsuranceBounds: true,
    });

    expect(result.insuranceBase).toBe(17_500_000);
    expect(result.totalInsurance).toBe(1_837_500);
  });

  it("can clamp insurance base to 2026 regional minimum and caps", () => {
    const low = getInsuranceBase({
      region: "III",
      insuranceSalary: 1_000_000,
      insuranceContributionPercent: 100,
      applyInsuranceBounds: true,
    });
    const high = getInsuranceBase({
      region: "I",
      insuranceSalary: 80_000_000,
      insuranceContributionPercent: 100,
      applyInsuranceBounds: true,
    });

    expect(low).toBe(4_140_000);
    expect(high).toBe(46_800_000);
  });

  it("converts net back to gross by binary search", () => {
    const grossResult = calculateGrossToNet({
      grossSalary: 35_000_000,
      dependents: 2,
      region: "I",
      insuranceSalary: 35_000_000,
      insuranceContributionPercent: 100,
      applyInsuranceBounds: true,
    });

    const netResult = calculateNetToGross({
      targetNetSalary: grossResult.netSalary,
      dependents: 2,
      region: "I",
      insuranceContributionPercent: 100,
      applyInsuranceBounds: true,
      insuranceBaseMode: "matchGross",
    });

    expect(netResult.grossSalary).toBeCloseTo(35_000_000, -2);
  });

  it("formats VND in Vietnamese grouping", () => {
    expect(formatVnd(28_857_500)).toBe("28.857.500 đ");
  });
});
