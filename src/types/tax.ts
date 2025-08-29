export interface TaxFormData {
  // Form fields from German income certificate
  periodsWithoutEntitlement: number;
  grossSalary: number;
  withheldIncomeTax: number;
  withheldSolidaritySurcharge: number;
  withheldChurchTax: number;
  taxFreeReimbursements: number;
  flat15TaxedReimbursements: number;
  employerPensionContributions: number;
  employeePensionContributions: number;
  taxFreeEmployerSubsidies: number;
  employeeHealthInsurance: number;
  employeeLongTermCareInsurance: number;
  employeeUnemploymentInsurance: number;
  oneFifthPayment: number;

  // Additional mandatory taxpayer attributes
  taxYear: number;
  taxClass: 1 | 2 | 3 | 4 | 5 | 6;
  maritalStatus: 'single' | 'married' | 'widowed' | 'divorced';
  jointAssessment: boolean;
  numberOfChildren: number;
  churchMembership: boolean;
  federalState: string;
  socialSecurityStatus: 'statutory' | 'private';
  additionalContributionRate: number;
  freibetrag: number;
}

export interface TaxCalculationResult {
  taxableIncome: number; // zvE (including severance in gross)
  incomeTax: number;
  solidaritySurcharge: number;
  churchTax: number;
  totalLiability: number;
  withheldTaxes: number;
  refundOrPayment: number;
  isRefund: boolean;
  oneFifthRuleAmount: number;
  severanceTaxImpact: number;
  // Debug fields
  estBaseTax?: number; // ESt1 used in final (on zvE_base when severance present, else on zvE)
  estWithOneFifth?: number; // ESt2 on zvE_base + 1/5 severance
  severanceDelta?: number; // ESt2 - ESt1 (base)
  zvEBase?: number; // zvE excluding severance from gross
  taxOnZvE?: number; // TAX(zvE)
  taxOnZvEBase?: number; // TAX(zvE_base)
}

export interface FederalStateInfo {
  name: string;
  churchTaxRate: number; // 8 or 9
}