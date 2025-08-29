import { GermanTaxLawVerifier } from './taxVerifier';
import { calculateTax } from './taxCalculator';
import { TaxFormData } from '../types/tax';

/**
 * Sample test cases for German tax law verification
 * These represent realistic scenarios to test calculator accuracy
 */
export const TEST_CASES: Array<{name: string, data: TaxFormData}> = [
  {
    name: "Single Employee, Low Income (Below Basic Allowance)",
    data: {
      periodsWithoutEntitlement: 0,
      grossSalary: 10000,
      withheldIncomeTax: 0,
      withheldSolidaritySurcharge: 0,
      withheldChurchTax: 0,
      taxFreeReimbursements: 0,
      flat15TaxedReimbursements: 0,
      employerPensionContributions: 0,
      employeePensionContributions: 0,
      taxFreeEmployerSubsidies: 0,
      employeeHealthInsurance: 0,
      employeeLongTermCareInsurance: 0,
      employeeUnemploymentInsurance: 0,
      oneFifthPayment: 0,
      taxYear: 2025,
      taxClass: 1,
      maritalStatus: 'single',
      jointAssessment: false,
      numberOfChildren: 0,
      churchMembership: false,
      federalState: 'Bayern',
      socialSecurityStatus: 'statutory',
      additionalContributionRate: 1.6,
      freibetrag: 0
    }
  },
  {
    name: "Single Employee, Medium Income",
    data: {
      periodsWithoutEntitlement: 0,
      grossSalary: 50000,
      withheldIncomeTax: 8000,
      withheldSolidaritySurcharge: 440,
      withheldChurchTax: 0,
      taxFreeReimbursements: 1000,
      flat15TaxedReimbursements: 500,
      employerPensionContributions: 4500,
      employeePensionContributions: 4500,
      taxFreeEmployerSubsidies: 800,
      employeeHealthInsurance: 3500,
      employeeLongTermCareInsurance: 600,
      employeeUnemploymentInsurance: 500,
      oneFifthPayment: 0,
      taxYear: 2025,
      taxClass: 1,
      maritalStatus: 'single',
      jointAssessment: false,
      numberOfChildren: 0,
      churchMembership: false,
      federalState: 'Bayern',
      socialSecurityStatus: 'statutory',
      additionalContributionRate: 1.6,
      freibetrag: 0
    }
  },
  {
    name: "Married Couple, High Income, 2 Children, Church Member",
    data: {
      periodsWithoutEntitlement: 0,
      grossSalary: 100000,
      withheldIncomeTax: 25000,
      withheldSolidaritySurcharge: 1375,
      withheldChurchTax: 2000,
      taxFreeReimbursements: 2000,
      flat15TaxedReimbursements: 1000,
      employerPensionContributions: 9000,
      employeePensionContributions: 9000,
      taxFreeEmployerSubsidies: 1500,
      employeeHealthInsurance: 7000,
      employeeLongTermCareInsurance: 1200,
      employeeUnemploymentInsurance: 1000,
      oneFifthPayment: 0,
      taxYear: 2025,
      taxClass: 3,
      maritalStatus: 'married',
      jointAssessment: true,
      numberOfChildren: 2,
      churchMembership: true,
      federalState: 'Bayern',
      socialSecurityStatus: 'statutory',
      additionalContributionRate: 1.6,
      freibetrag: 0
    }
  },
  {
    name: "Employee with Severance Payment (One-Fifth Rule)",
    data: {
      periodsWithoutEntitlement: 0,
      grossSalary: 60000,
      withheldIncomeTax: 12000,
      withheldSolidaritySurcharge: 660,
      withheldChurchTax: 0,
      taxFreeReimbursements: 1500,
      flat15TaxedReimbursements: 800,
      employerPensionContributions: 5400,
      employeePensionContributions: 5400,
      taxFreeEmployerSubsidies: 1200,
      employeeHealthInsurance: 4200,
      employeeLongTermCareInsurance: 720,
      employeeUnemploymentInsurance: 600,
      oneFifthPayment: 50000, // €50,000 severance payment
      taxYear: 2025,
      taxClass: 1,
      maritalStatus: 'single',
      jointAssessment: false,
      numberOfChildren: 0,
      churchMembership: false,
      federalState: 'Berlin',
      socialSecurityStatus: 'statutory',
      additionalContributionRate: 1.6,
      freibetrag: 0
    }
  },
  {
    name: "High Income, No Church, 9% Church Tax State",
    data: {
      periodsWithoutEntitlement: 0,
      grossSalary: 150000,
      withheldIncomeTax: 45000,
      withheldSolidaritySurcharge: 2475,
      withheldChurchTax: 0,
      taxFreeReimbursements: 3000,
      flat15TaxedReimbursements: 1500,
      employerPensionContributions: 13500,
      employeePensionContributions: 13500,
      taxFreeEmployerSubsidies: 2000,
      employeeHealthInsurance: 10500,
      employeeLongTermCareInsurance: 1800,
      employeeUnemploymentInsurance: 1500,
      oneFifthPayment: 0,
      taxYear: 2025,
      taxClass: 1,
      maritalStatus: 'single',
      jointAssessment: false,
      numberOfChildren: 1,
      churchMembership: false,
      federalState: 'Berlin', // 9% church tax state
      socialSecurityStatus: 'statutory',
      additionalContributionRate: 1.6,
      freibetrag: 1000
    }
  }
];

/**
 * Run comprehensive verification tests
 */
export function runVerificationTests(): void {
  console.log('=== Running German Tax Law Verification Tests ===\n');
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}: ${testCase.name}`);
    console.log('='.repeat(50));
    
    // Calculate tax result
    const result = calculateTax(testCase.data);
    
    // Run verification
    const verification = GermanTaxLawVerifier.verifyAllCalculations(result, testCase.data);
    
    // Generate and display report
    const report = GermanTaxLawVerifier.generateVerificationReport(verification);
    console.log(report);
    
    console.log('\n' + '='.repeat(70) + '\n');
  });
}

/**
 * Quick validation check for a single calculation
 */
export function validateSingleCalculation(data: TaxFormData): {isValid: boolean, issues: string[]} {
  const result = calculateTax(data);
  const verification = GermanTaxLawVerifier.verifyAllCalculations(result, data);
  
  const issues: string[] = [];
  
  // Check for failed tests
  const allTests = [
    ...verification.incomeTaxVerification,
    ...verification.solidaritySurchargeVerification,
    ...verification.churchTaxVerification,
    ...verification.oneFifthRuleVerification
  ];
  
  allTests.forEach(test => {
    if (!test.passed) {
      issues.push(`${test.testName}: Expected ${test.expected.toFixed(2)}, got ${test.actual.toFixed(2)}`);
    }
  });
  
  // Check overall verification
  const overall = verification.overallVerification;
  if (!overall.basicAllowanceApplied) {
    issues.push('Basic allowance not applied correctly');
  }
  if (!overall.socialSecurityDeductionsApplied) {
    issues.push('Social security deductions not applied correctly');
  }
  if (!overall.taxTariffProgression) {
    issues.push('Tax tariff progression seems incorrect');
  }
  if (!overall.calculationWithinBounds) {
    issues.push('Calculation result outside reasonable bounds');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}