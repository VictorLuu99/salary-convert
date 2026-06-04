export type Region = "I" | "II" | "III" | "IV";

export type SalaryInput = {
  grossSalary: number;
  dependents: number;
  region: Region;
  insuranceSalary: number;
  insuranceContributionPercent: number;
  applyInsuranceBounds: boolean;
};

export type NetToGrossInput = {
  targetNetSalary: number;
  dependents: number;
  region: Region;
  insuranceContributionPercent: number;
  applyInsuranceBounds: boolean;
  insuranceBaseMode: "matchGross" | "fixed";
  fixedInsuranceSalary?: number;
};

export type InsuranceBaseInput = {
  region: Region;
  insuranceSalary: number;
  insuranceContributionPercent: number;
  applyInsuranceBounds: boolean;
};

export type SalaryResult = {
  grossSalary: number;
  netSalary: number;
  insuranceBase: number;
  socialInsurance: number;
  healthInsurance: number;
  unemploymentInsurance: number;
  totalInsurance: number;
  familyDeduction: number;
  taxableIncome: number;
  personalIncomeTax: number;
  pitBrackets: PitLine[];
  cappedInsuranceBase: boolean;
  raisedInsuranceBase: boolean;
};

export type PitLine = {
  label: string;
  taxable: number;
  rate: number;
  tax: number;
};

export const PERSONAL_DEDUCTION = 15_500_000;
export const DEPENDENT_DEDUCTION = 6_200_000;
export const REFERENCE_SALARY = 2_340_000;
export const SOCIAL_HEALTH_CAP = REFERENCE_SALARY * 20;

export const REGION_MINIMUM_WAGES: Record<Region, number> = {
  I: 5_310_000,
  II: 4_730_000,
  III: 4_140_000,
  IV: 3_700_000,
};

export const EMPLOYEE_INSURANCE_RATES = {
  social: 0.08,
  health: 0.015,
  unemployment: 0.01,
};

const PIT_BRACKETS = [
  { limit: 5_000_000, rate: 0.05, label: "Đến 5 triệu" },
  { limit: 10_000_000, rate: 0.1, label: "Trên 5 - 10 triệu" },
  { limit: 18_000_000, rate: 0.15, label: "Trên 10 - 18 triệu" },
  { limit: 32_000_000, rate: 0.2, label: "Trên 18 - 32 triệu" },
  { limit: 52_000_000, rate: 0.25, label: "Trên 32 - 52 triệu" },
  { limit: 80_000_000, rate: 0.3, label: "Trên 52 - 80 triệu" },
  { limit: Infinity, rate: 0.35, label: "Trên 80 triệu" },
];

const roundVnd = (value: number) => Math.round(value);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getUnemploymentCap(region: Region) {
  return REGION_MINIMUM_WAGES[region] * 20;
}

export function getInsuranceBase(input: InsuranceBaseInput) {
  const rawBase =
    sanitizeMoney(input.insuranceSalary) *
    (sanitizePercent(input.insuranceContributionPercent) / 100);

  if (!input.applyInsuranceBounds) {
    return roundVnd(rawBase);
  }

  return roundVnd(
    clamp(rawBase, REGION_MINIMUM_WAGES[input.region], SOCIAL_HEALTH_CAP),
  );
}

export function calculatePit(taxableIncome: number): {
  tax: number;
  lines: PitLine[];
} {
  let remaining = Math.max(0, taxableIncome);
  let previousLimit = 0;
  const lines: PitLine[] = [];

  for (const bracket of PIT_BRACKETS) {
    if (remaining <= 0) break;

    const width = bracket.limit - previousLimit;
    const taxable = Math.min(remaining, width);
    const tax = taxable * bracket.rate;
    lines.push({
      label: bracket.label,
      taxable: roundVnd(taxable),
      rate: bracket.rate,
      tax: roundVnd(tax),
    });

    remaining -= taxable;
    previousLimit = bracket.limit;
  }

  return {
    tax: roundVnd(lines.reduce((sum, line) => sum + line.tax, 0)),
    lines,
  };
}

export function calculateGrossToNet(input: SalaryInput): SalaryResult {
  const grossSalary = sanitizeMoney(input.grossSalary);
  const insuranceSalary = sanitizeMoney(input.insuranceSalary);
  const desiredBase =
    insuranceSalary * (sanitizePercent(input.insuranceContributionPercent) / 100);
  const insuranceBase = getInsuranceBase(input);
  const unemploymentBase = input.applyInsuranceBounds
    ? Math.min(insuranceBase, getUnemploymentCap(input.region))
    : insuranceBase;

  const socialInsurance = roundVnd(
    insuranceBase * EMPLOYEE_INSURANCE_RATES.social,
  );
  const healthInsurance = roundVnd(
    insuranceBase * EMPLOYEE_INSURANCE_RATES.health,
  );
  const unemploymentInsurance = roundVnd(
    unemploymentBase * EMPLOYEE_INSURANCE_RATES.unemployment,
  );
  const totalInsurance =
    socialInsurance + healthInsurance + unemploymentInsurance;
  const familyDeduction =
    PERSONAL_DEDUCTION +
    Math.max(0, Math.floor(input.dependents)) * DEPENDENT_DEDUCTION;
  const taxableIncome = roundVnd(
    Math.max(0, grossSalary - totalInsurance - familyDeduction),
  );
  const pit = calculatePit(taxableIncome);
  const netSalary = roundVnd(grossSalary - totalInsurance - pit.tax);

  return {
    grossSalary,
    netSalary,
    insuranceBase,
    socialInsurance,
    healthInsurance,
    unemploymentInsurance,
    totalInsurance,
    familyDeduction,
    taxableIncome,
    personalIncomeTax: pit.tax,
    pitBrackets: pit.lines,
    cappedInsuranceBase: input.applyInsuranceBounds && insuranceBase < desiredBase,
    raisedInsuranceBase: input.applyInsuranceBounds && insuranceBase > desiredBase,
  };
}

export function calculateNetToGross(input: NetToGrossInput): SalaryResult {
  const targetNetSalary = sanitizeMoney(input.targetNetSalary);
  let low = 0;
  let high = Math.max(targetNetSalary * 2 + 100_000_000, 100_000_000);
  let best = createGrossCandidate(high, input);

  for (let i = 0; i < 90; i += 1) {
    const mid = (low + high) / 2;
    const candidate = createGrossCandidate(mid, input);

    if (candidate.netSalary >= targetNetSalary) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }

  return createGrossCandidate(roundVnd(best.grossSalary), input);
}

export function formatVnd(value: number) {
  return `${roundVnd(value).toLocaleString("vi-VN")} đ`;
}

export function parseVnd(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
}

export function sanitizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function sanitizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return clamp(value, 0, 200);
}

function createGrossCandidate(grossSalary: number, input: NetToGrossInput) {
  const insuranceSalary =
    input.insuranceBaseMode === "matchGross"
      ? grossSalary
      : (input.fixedInsuranceSalary ?? grossSalary);

  return calculateGrossToNet({
    grossSalary,
    dependents: input.dependents,
    region: input.region,
    insuranceSalary,
    insuranceContributionPercent: input.insuranceContributionPercent,
    applyInsuranceBounds: input.applyInsuranceBounds,
  });
}
