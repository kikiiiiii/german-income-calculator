import { TaxFormData, TaxCalculationResult, FederalStateInfo } from '../types/tax';

export const FEDERAL_STATES: FederalStateInfo[] = [
  { name: 'Baden-Württemberg', churchTaxRate: 8 },
  { name: 'Bayern', churchTaxRate: 8 },
  { name: 'Berlin', churchTaxRate: 9 },
  { name: 'Brandenburg', churchTaxRate: 9 },
  { name: 'Bremen', churchTaxRate: 9 },
  { name: 'Hamburg', churchTaxRate: 9 },
  { name: 'Hessen', churchTaxRate: 9 },
  { name: 'Mecklenburg-Vorpommern', churchTaxRate: 9 },
  { name: 'Niedersachsen', churchTaxRate: 9 },
  { name: 'Nordrhein-Westfalen', churchTaxRate: 9 },
  { name: 'Rheinland-Pfalz', churchTaxRate: 9 },
  { name: 'Saarland', churchTaxRate: 9 },
  { name: 'Sachsen', churchTaxRate: 9 },
  { name: 'Sachsen-Anhalt', churchTaxRate: 9 },
  { name: 'Schleswig-Holstein', churchTaxRate: 9 },
  { name: 'Thüringen', churchTaxRate: 9 },
];

export const TAX_YEAR_CONSTANTS = {
  2025: {
    basicAllowance: 12096,
    solidaritySurchargeThreshold: 18130, // Income tax threshold per design spec
    solidaritySurchargeReductionThreshold: 13469,
    childAllowance: 12846, // €6,423 per parent = €12,846 total per design spec
    // §32a EStG 2025 progression zones per official BMF tables
    zone1Threshold: 17444, // 12,097 - 17,444
    zone2Threshold: 68481, // 17,445 - 68,481
    zone3Threshold: 277826, // 68,482 - 277,826
    // Zone 1: quadratic formula (12,097 - 17,444)
    zone1Y: 997.80,
    zone1Z: 0.14,
    // Zone 2: quadratic formula (17,445 - 68,481)
    zone2C: 1380.72,
    zone2E: 0.0000826,
    zone2F: 2397,
    // Zone 3: 42% of zvE - constant (68,482 - 277,826)
    zone3Constant: 0.42,
    zone3Deduction: 2663.76,
    // Zone 4: 45% of zvE - constant (>277,826)
    zone4Constant: 0.45,
    zone4Deduction: 9591.84,
  },
  2024: {
    basicAllowance: 11784,
    solidaritySurchargeThreshold: 17688,
    solidaritySurchargeReductionThreshold: 13396,
    childAllowance: 9600, // €4,800 per parent = €9,600 total per design spec
    // §32a EStG 2024 progression zones per official BMF tables
    zone1Threshold: 17006, // 11,785 - 17,006
    zone2Threshold: 66761, // 17,007 - 66,761
    zone3Threshold: 277826, // 66,762 - 277,826
    // Zone 1: quadratic formula
    zone1Y: 997.80,
    zone1Z: 0.14,
    // Zone 2: quadratic formula
    zone2C: 1380.72,
    zone2E: 0.0000826,
    zone2F: 2397,
    // Zone 3: 42% of zvE - constant
    zone3Constant: 0.42,
    zone3Deduction: 2663.76,
    // Zone 4: 45% of zvE - constant
    zone4Constant: 0.45,
    zone4Deduction: 9591.84,
  },
};

// Helper function to round down to full € as required by German tax law
function roundDownToFullEuro(amount: number): number {
  return Math.floor(amount);
}

export function calculateIncomeTax(taxableIncome: number, taxYear: number): number {
  const constants = TAX_YEAR_CONSTANTS[taxYear as keyof typeof TAX_YEAR_CONSTANTS] || TAX_YEAR_CONSTANTS[2024];
  
  if (taxableIncome <= constants.basicAllowance) {
    return 0;
  }

  const x = taxableIncome; // x is zvE
  let tax: number;
  
  if (x <= constants.zone1Threshold) { // 11,785 - 17,006 (2024) or 12,097 - 17,444 (2025)
    const y = (x - constants.basicAllowance) / 10000;
    tax = (constants.zone1Y * y + constants.zone1Z) * y;
  } else if (x <= constants.zone2Threshold) { // 17,007 - 66,761 (2024) or 17,445 - 68,481 (2025)
    const z = (x - constants.zone1Threshold) / 10000;
    tax = (constants.zone2C * z + constants.zone2E) * z + constants.zone2F;
  } else if (x <= constants.zone3Threshold) { // 66,762 - 277,826 (2024) or 68,482 - 277,826 (2025)
    tax = constants.zone3Constant * x - constants.zone3Deduction;
  } else { // x >= 277,827 (2024) or x >= 277,827 (2025)
    tax = constants.zone4Constant * x - constants.zone4Deduction;
  }
  
  tax = Math.max(0, tax); // Ensure tax is never negative
  return Math.round(tax * 100) / 100; // Round to full cents
}

export function calculateSolidaritySurcharge(incomeTax: number, taxableIncome: number, taxYear: number): number {
  const constants = TAX_YEAR_CONSTANTS[taxYear as keyof typeof TAX_YEAR_CONSTANTS] || TAX_YEAR_CONSTANTS[2025];
  
  if (incomeTax === 0) return 0;
  
  // Per design specification: exemption based on income tax amount, not taxable income
  if (incomeTax <= constants.solidaritySurchargeThreshold) {
    return 0;
  }
  
  // Phase-in calculation (simplified - design mentions gradual phase-in until full Soli at ~€31,528 tax)
  // For now, apply full 5.5% once above exemption threshold
  const soli = incomeTax * 0.055;
  return Math.round(soli * 100) / 100;
}

export function calculateChurchTax(incomeTax: number, churchMembership: boolean, federalState: string): number {
  if (!churchMembership || incomeTax === 0) return 0;
  
  const stateInfo = FEDERAL_STATES.find(state => state.name === federalState);
  const rate = stateInfo ? stateInfo.churchTaxRate / 100 : 0.09;
  
  const churchTax = incomeTax * rate;
  return Math.round(churchTax * 100) / 100;
}

export function calculateTax(data: TaxFormData): TaxCalculationResult {
  const { 
    grossSalary = 0, 
    taxFreeEmployerSubsidies = 0, 
    employeePensionContributions = 0, 
    employeeHealthInsurance = 0, 
    employeeLongTermCareInsurance = 0, 
    employeeUnemploymentInsurance = 0,
    withheldIncomeTax = 0, 
    withheldSolidaritySurcharge = 0, 
    withheldChurchTax = 0,
    taxYear = 2025, 
    churchMembership = false, 
    federalState = 'Bayern', 
    numberOfChildren = 0,
    oneFifthPayment = 0,
    taxFreeReimbursements = 0,
    flat15TaxedReimbursements = 0,
    taxClass = 1,
    maritalStatus = 'single',
    jointAssessment = false,
    freibetrag = 0
  } = data;

  const constants = TAX_YEAR_CONSTANTS[taxYear as keyof typeof TAX_YEAR_CONSTANTS] || TAX_YEAR_CONSTANTS[2025];
  
  // Calculate taxable income according to German tax law principles
  // Build two bases:
  // - zvE_base: excludes severance embedded in gross (for §34 delta)
  // - zvE: includes severance in gross (for regular tax without one-fifth)
  const grossExcludingSeverance = Math.max(0, grossSalary - (oneFifthPayment || 0));
  
  // Income parts before social deductions and allowances
  const preDeductionsIncludingSeverance = grossSalary + flat15TaxedReimbursements - taxFreeReimbursements - taxFreeEmployerSubsidies;
  const preDeductionsExcludingSeverance = grossExcludingSeverance + flat15TaxedReimbursements - taxFreeReimbursements - taxFreeEmployerSubsidies;
  
  // Subtract social security contributions (Lines 22-27)
  const socialSecurityDeductions = employeePensionContributions + employeeHealthInsurance + 
                                   employeeLongTermCareInsurance + employeeUnemploymentInsurance;
  
  // Apply social deductions
  const baseIncludingSeverance = Math.max(0, preDeductionsIncludingSeverance - socialSecurityDeductions);
  const baseExcludingSeverance = Math.max(0, preDeductionsExcludingSeverance - socialSecurityDeductions);
  
  // Apply basic allowance (Grundfreibetrag)
  const afterBasicIncluding = Math.max(0, baseIncludingSeverance - constants.basicAllowance);
  const afterBasicExcluding = Math.max(0, baseExcludingSeverance - constants.basicAllowance);
  
  // Apply child allowance (Kinderfreibetrag)
  const afterChildIncluding = Math.max(0, afterBasicIncluding - (numberOfChildren * constants.childAllowance));
  const afterChildExcluding = Math.max(0, afterBasicExcluding - (numberOfChildren * constants.childAllowance));
  
  // Apply Freibetrag from ELStAM
  const zvE_raw = Math.max(0, afterChildIncluding - freibetrag);
  const zvE_base_raw = Math.max(0, afterChildExcluding - freibetrag);
  
  // Round down to full € as required by German tax law
  const zvE = roundDownToFullEuro(zvE_raw);
  const zvE_base = roundDownToFullEuro(zvE_base_raw);
  
  let incomeTax: number;
  let oneFifthRuleAmount = 0;
  let severanceTaxImpact = 0;
  
  // Precompute ESt on zvE (including severance) and on zvE_base (excluding severance)
  const estOnZvE = calculateIncomeTax(zvE, taxYear);
  const estOnZvEBase = calculateIncomeTax(zvE_base, taxYear);
  
  if (oneFifthPayment > 0) {
    // Apply §34 EStG one-fifth rule using zvE_base only
    oneFifthRuleAmount = oneFifthPayment / 5;
    
    // ESt1 = TAX(zvE_base)
    const estBaseTax = estOnZvEBase;
    
    // ESt2 = TAX(zvE_base + 1/5 severance)
    const estWithOneFifth = calculateIncomeTax(zvE_base + oneFifthRuleAmount, taxYear);
    
    // Δ and multiply by 5
    const delta = Math.max(0, estWithOneFifth - estBaseTax);
    severanceTaxImpact = delta * 5;
    
    // Final income tax = ESt1 + severance impact
    incomeTax = estBaseTax + severanceTaxImpact;

    (calculateTax as any)._tmp_estBaseTax = estBaseTax; // ESt1 on zvE_base
    (calculateTax as any)._tmp_estWithOneFifth = estWithOneFifth; // ESt2 on base + 1/5
    (calculateTax as any)._tmp_delta = delta;
  } else {
    // No severance: regular tax on zvE
    incomeTax = estOnZvE;
  }
  
  // Apply tax class and splitting adjustments (simplified)
  let finalIncomeTax = incomeTax;
  if (taxClass === 3 || taxClass === 5) {
    finalIncomeTax = incomeTax * 0.9;
  } else if (taxClass === 6) {
    finalIncomeTax = incomeTax * 1.1;
  }
  if (jointAssessment && maritalStatus === 'married') {
    finalIncomeTax = finalIncomeTax * 0.95;
  }
  
  const solidaritySurcharge = calculateSolidaritySurcharge(finalIncomeTax, zvE, taxYear);
  const churchTax = calculateChurchTax(finalIncomeTax, churchMembership, federalState);
  
  const totalLiability = finalIncomeTax + solidaritySurcharge + churchTax;
  const withheldTaxes = withheldIncomeTax + (withheldSolidaritySurcharge || 0) + (withheldChurchTax || 0);
  const refundOrPayment = withheldTaxes - totalLiability;
  
  return {
    taxableIncome: zvE,
    incomeTax: finalIncomeTax,
    solidaritySurcharge,
    churchTax,
    totalLiability,
    withheldTaxes,
    refundOrPayment,
    isRefund: refundOrPayment > 0,
    oneFifthRuleAmount,
    severanceTaxImpact,
    estBaseTax: (calculateTax as any)._tmp_estBaseTax,
    estWithOneFifth: (calculateTax as any)._tmp_estWithOneFifth,
    severanceDelta: (calculateTax as any)._tmp_delta,
    zvEBase: zvE_base,
    taxOnZvE: estOnZvE,
    taxOnZvEBase: estOnZvEBase
  };
}

export function validateTaxData(data: Partial<TaxFormData>): string[] {
  const errors: string[] = [];
  
  if (!data.taxYear || data.taxYear < 2020 || data.taxYear > 2030) {
    errors.push('Invalid tax year');
  }
  
  if (!data.taxClass || data.taxClass < 1 || data.taxClass > 6) {
    errors.push('Invalid tax class');
  }
  
  if (data.maritalStatus === 'married' && (data.taxClass || 0) > 4) {
    errors.push('Tax classes 5 and 6 are not available for married couples');
  }
  
  if (data.grossSalary !== undefined && data.grossSalary < 0) {
    errors.push('Gross salary cannot be negative');
  }
  
  if (data.numberOfChildren !== undefined && data.numberOfChildren < 0) {
    errors.push('Number of children cannot be negative');
  }
  
  return errors;
}