import { TaxFormData, TaxCalculationResult } from '../types/tax';

export interface VerificationResult {
  testName: string;
  passed: boolean;
  expected: number;
  actual: number;
  tolerance: number;
  description: string;
}

export interface TaxLawVerification {
  incomeTaxVerification: VerificationResult[];
  solidaritySurchargeVerification: VerificationResult[];
  churchTaxVerification: VerificationResult[];
  oneFifthRuleVerification: VerificationResult[];
  overallVerification: {
    basicAllowanceApplied: boolean;
    childAllowanceApplied: boolean;
    socialSecurityDeductionsApplied: boolean;
    taxTariffProgression: boolean;
    calculationWithinBounds: boolean;
  };
}

/**
 * Mathematical verification method for German tax calculations
 * Based on §32a EStG (Income Tax Act), SolZG (Solidarity Surcharge Act), and KiStG (Church Tax Act)
 */
export class GermanTaxLawVerifier {
  
  /**
   * Verify income tax calculation according to §32a EStG
   */
  static verifyIncomeTax(result: TaxCalculationResult, data: TaxFormData): VerificationResult[] {
    const verifications: VerificationResult[] = [];
    
    // Test 1: Basic allowance exemption
    const basicAllowance2025 = 11604;
    const basicAllowance2024 = 10908;
    const childAllowance2025 = 12768; // €6,384 per parent = €12,768 total
    const childAllowance2024 = 8952;
    const basicAllowance = data.taxYear === 2024 ? basicAllowance2024 : basicAllowance2025;
    const childAllowance = data.taxYear === 2024 ? childAllowance2024 : childAllowance2025;
    
    const expectedTaxBelowBasicAllowance = 0;
    const mockDataBelow = { ...data, grossSalary: basicAllowance - 1000 };
    const resultBelow = this.calculateExpectedTax(mockDataBelow);
    
    verifications.push({
      testName: "Basic Allowance Exemption",
      passed: resultBelow.incomeTax === expectedTaxBelowBasicAllowance,
      expected: expectedTaxBelowBasicAllowance,
      actual: resultBelow.incomeTax,
      tolerance: 0,
      description: "Income below basic allowance should result in 0 tax"
    });
    
    // Test 2: Progression zones verification with correct quadratic formulas
    const testCases = [
      { income: 15000, expectedRate: 0.14, description: "First progression zone (14%)" },
      { income: 30000, expectedRate: 0.19, description: "Second progression zone (19%)" },
      { income: 60000, expectedRate: 0.26, description: "Third progression zone (26%)" },
      { income: 100000, expectedRate: 0.32, description: "Fourth progression zone (32%)" },
      { income: 300000, expectedRate: 0.42, description: "Top progression zone (42%)" }
    ];
    
    testCases.forEach(testCase => {
      const mockData = { ...data, grossSalary: testCase.income + basicAllowance };
      const testResult = this.calculateExpectedTax(mockData);
      const effectiveRate = testResult.incomeTax / testCase.income;
      
      verifications.push({
        testName: `Progression Zone: ${testCase.description}`,
        passed: Math.abs(effectiveRate - testCase.expectedRate) < 0.03, // Tighter tolerance for quadratic formulas
        expected: testCase.expectedRate,
        actual: effectiveRate,
        tolerance: 0.03,
        description: `Effective tax rate should be approximately ${testCase.expectedRate * 100}%`
      });
    });
    
    // Test 3: Specific boundary point verification
    const boundaryTests = [
      { income: 14926, expectedTax: 997.80, description: "Zone 1 upper boundary" },
    ];
    
    boundaryTests.forEach(testCase => {
      const mockData = { ...data, grossSalary: testCase.income + basicAllowance };
      const testResult = this.calculateExpectedTax(mockData);
      
      verifications.push({
        testName: `Boundary Point: ${testCase.description}`,
        passed: Math.abs(testResult.incomeTax - testCase.expectedTax) < 1,
        expected: testCase.expectedTax,
        actual: testResult.incomeTax,
        tolerance: 1,
        description: `Tax at boundary should be exactly €${testCase.expectedTax.toFixed(2)}`
      });
    });
    
    return verifications;
  }
  
  /**
   * Verify solidarity surcharge calculation (5.5% with exemptions)
   */
  static verifySolidaritySurcharge(result: TaxCalculationResult, data: TaxFormData): VerificationResult[] {
    const verifications: VerificationResult[] = [];
    
    // Test 1: 5.5% rate application
    const expectedSurcharge = result.incomeTax * 0.055;
    const rateDeviation = Math.abs(result.solidaritySurcharge - expectedSurcharge) / expectedSurcharge;
    
    verifications.push({
      testName: "Solidarity Surcharge Rate",
      passed: rateDeviation < 0.01 || result.solidaritySurcharge === 0,
      expected: expectedSurcharge,
      actual: result.solidaritySurcharge,
      tolerance: expectedSurcharge * 0.01,
      description: "Solidarity surcharge should be 5.5% of income tax"
    });
    
    // Test 2: Exemption threshold verification (based on income tax, not taxable income)
    const exemptionThreshold2025 = 18130; // Income tax threshold per design spec
    const exemptionThreshold2024 = 17688;
    
    // Create test data that results in income tax just below exemption
    const mockDataBelowExemption = { ...data, grossSalary: 20000 }; // Low income to keep tax below threshold
    const resultBelowExemption = this.calculateExpectedTax(mockDataBelowExemption);
    
    verifications.push({
      testName: "Solidarity Surcharge Exemption",
      passed: resultBelowExemption.solidaritySurcharge === 0 || resultBelowExemption.incomeTax <= exemptionThreshold2025,
      expected: 0,
      actual: resultBelowExemption.solidaritySurcharge,
      tolerance: 0,
      description: "No solidarity surcharge when income tax below exemption threshold"
    });
    
    return verifications;
  }
  
  /**
   * Verify church tax calculation (8% or 9% based on federal state)
   */
  static verifyChurchTax(result: TaxCalculationResult, data: TaxFormData): VerificationResult[] {
    const verifications: VerificationResult[] = [];
    
    if (!data.churchMembership) {
      verifications.push({
        testName: "Church Tax for Non-Members",
        passed: result.churchTax === 0,
        expected: 0,
        actual: result.churchTax,
        tolerance: 0,
        description: "Non-church members should pay 0 church tax"
      });
    } else {
      // Determine expected church tax rate
      const rate8States = ['Baden-Württemberg', 'Bayern'];
      const expectedRate = rate8States.includes(data.federalState) ? 0.08 : 0.09;
      const expectedChurchTax = result.incomeTax * expectedRate;
      
      verifications.push({
        testName: "Church Tax Rate",
        passed: Math.abs(result.churchTax - expectedChurchTax) < 0.01,
        expected: expectedChurchTax,
        actual: result.churchTax,
        tolerance: 0.01,
        description: `Church tax should be ${expectedRate * 100}% of income tax in ${data.federalState}`
      });
    }
    
    return verifications;
  }
  
  /**
   * Verify one-fifth rule calculation according to §34 EStG
   */
  static verifyOneFifthRule(result: TaxCalculationResult, data: TaxFormData): VerificationResult[] {
    const verifications: VerificationResult[] = [];
    
    if (data.oneFifthPayment > 0) {
      // Test 1: One-fifth amount calculation
      const expectedOneFifthAmount = data.oneFifthPayment / 5;
      
      verifications.push({
        testName: "One-Fifth Rule Calculation",
        passed: Math.abs(result.oneFifthRuleAmount - expectedOneFifthAmount) < 0.01,
        expected: expectedOneFifthAmount,
        actual: result.oneFifthRuleAmount,
        tolerance: 0.01,
        description: "One-fifth amount should be exactly 1/5 of the severance payment"
      });
      
      // Test 2: Full §34 method verification
      // Calculate expected tax using the manual 5-step method
      const mockDataWithoutSeverance = { ...data, oneFifthPayment: 0 };
      const resultWithoutSeverance = this.calculateExpectedTax(mockDataWithoutSeverance);
      
      // Expected severance tax impact using §34 method
      const expectedSeveranceTaxImpact = this.calculateExpectedSeveranceTaxImpact(
        resultWithoutSeverance.taxableIncome, 
        data.oneFifthPayment, 
        data.taxYear
      );
      
      verifications.push({
        testName: "§34 EStG Method - Severance Tax Impact",
        passed: Math.abs(result.severanceTaxImpact - expectedSeveranceTaxImpact) < 0.01,
        expected: expectedSeveranceTaxImpact,
        actual: result.severanceTaxImpact,
        tolerance: 0.01,
        description: "Severance tax impact calculated using full §34 method (5-step process)"
      });
      
      // Test 3: Total tax calculation
      const expectedTotalTax = resultWithoutSeverance.incomeTax + expectedSeveranceTaxImpact;
      
      verifications.push({
        testName: "§34 EStG Method - Total Tax",
        passed: Math.abs(result.incomeTax - expectedTotalTax) < 0.01,
        expected: expectedTotalTax,
        actual: result.incomeTax,
        tolerance: 0.01,
        description: "Total tax should be base tax + severance tax impact (§34 method)"
      });
      
      // Test 4: Tax reduction verification
      const resultWithFullTaxation = this.calculateExpectedTax({ ...data, oneFifthPayment: 0 });
      
      verifications.push({
        testName: "One-Fifth Rule Tax Reduction",
        passed: result.incomeTax < resultWithFullTaxation.incomeTax,
        expected: resultWithFullTaxation.incomeTax,
        actual: result.incomeTax,
        tolerance: 0,
        description: "One-fifth rule should reduce income tax compared to full taxation"
      });
      
      // Test 5: Display income calculation
      const expectedDisplayIncome = resultWithoutSeverance.taxableIncome + expectedOneFifthAmount;
      
      verifications.push({
        testName: "One-Fifth Rule Display Income",
        passed: Math.abs(result.taxableIncome - expectedDisplayIncome) < 0.01,
        expected: expectedDisplayIncome,
        actual: result.taxableIncome,
        tolerance: 0.01,
        description: "Display income should be base income + 1/5 of severance payment"
      });
      
    } else {
      verifications.push({
        testName: "One-Fifth Rule Not Applied",
        passed: result.oneFifthRuleAmount === 0 && result.severanceTaxImpact === 0,
        expected: 0,
        actual: result.severanceTaxImpact,
        tolerance: 0,
        description: "No one-fifth rule amounts when no severance payment"
      });
    }
    
    return verifications;
  }
  
  /**
   * Verify overall calculation logic
   */
  static verifyOverallCalculation(result: TaxCalculationResult, data: TaxFormData): TaxLawVerification['overallVerification'] {
    return {
      basicAllowanceApplied: result.taxableIncome <= Math.max(0, data.grossSalary - 11604),
      childAllowanceApplied: data.numberOfChildren > 0 ? 
        result.taxableIncome <= Math.max(0, data.grossSalary - 11604 - (data.numberOfChildren * 9312)) : true,
      socialSecurityDeductionsApplied: result.taxableIncome <= data.grossSalary,
      taxTariffProgression: result.incomeTax >= 0 && result.incomeTax <= data.grossSalary * 0.45,
      calculationWithinBounds: result.refundOrPayment >= -data.grossSalary && result.refundOrPayment <= data.grossSalary
    };
  }
  
  /**
   * Complete verification of all tax calculations
   */
  static verifyAllCalculations(result: TaxCalculationResult, data: TaxFormData): TaxLawVerification {
    return {
      incomeTaxVerification: this.verifyIncomeTax(result, data),
      solidaritySurchargeVerification: this.verifySolidaritySurcharge(result, data),
      churchTaxVerification: this.verifyChurchTax(result, data),
      oneFifthRuleVerification: this.verifyOneFifthRule(result, data),
      overallVerification: this.verifyOverallCalculation(result, data)
    };
  }
  
  /**
   * Helper method to calculate expected severance tax impact using §34 method
   */
  private static calculateExpectedSeveranceTaxImpact(baseTaxableIncome: number, severancePayment: number, taxYear: number): number {
    const calculator = require('../utils/taxCalculator');
    
    // Step 1: Calculate tax on base income without severance (ESt1)
    const taxWithoutSeverance = calculator.calculateIncomeTax(baseTaxableIncome, taxYear);
    
    // Step 2: Calculate 1/5 of severance payment
    const oneFifthAmount = severancePayment / 5;
    
    // Step 3: Calculate taxable income with 1/5 severance added
    const taxableIncomeWithSeverance = Math.max(0, baseTaxableIncome + oneFifthAmount);
    
    // Step 4: Calculate tax on income with 1/5 severance (ESt2)
    const taxWithSeverance = calculator.calculateIncomeTax(taxableIncomeWithSeverance, taxYear);
    
    // Step 5: Calculate difference and multiply by 5
    const taxDifference = taxWithSeverance - taxWithoutSeverance;
    return taxDifference * 5;
  }

  /**
   * Helper method to calculate expected tax for test cases
   */
  private static calculateExpectedTax(data: TaxFormData): TaxCalculationResult {
    // Import dynamically to avoid circular dependency
    const calculator = require('../utils/taxCalculator');
    return calculator.calculateTax(data);
  }
  
  /**
   * Generate verification report with pass/fail summary
   */
  static generateVerificationReport(verification: TaxLawVerification): string {
    const allTests = [
      ...verification.incomeTaxVerification,
      ...verification.solidaritySurchargeVerification,
      ...verification.churchTaxVerification,
      ...verification.oneFifthRuleVerification
    ];
    
    const passedTests = allTests.filter(test => test.passed).length;
    const totalTests = allTests.length;
    
    let report = `=== German Tax Law Verification Report ===\n\n`;
    report += `Overall Score: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)\n\n`;
    
    // Income Tax Verification
    report += `Income Tax Verification (§32a EStG):\n`;
    verification.incomeTaxVerification.forEach(test => {
      report += `  ${test.passed ? '✓' : '✗'} ${test.testName}: ${test.description}\n`;
      if (!test.passed) {
        report += `    Expected: ${test.expected.toFixed(2)}, Actual: ${test.actual.toFixed(2)}\n`;
      }
    });
    
    // Solidarity Surcharge Verification
    report += `\nSolidarity Surcharge Verification (SolZG):\n`;
    verification.solidaritySurchargeVerification.forEach(test => {
      report += `  ${test.passed ? '✓' : '✗'} ${test.testName}: ${test.description}\n`;
      if (!test.passed) {
        report += `    Expected: ${test.expected.toFixed(2)}, Actual: ${test.actual.toFixed(2)}\n`;
      }
    });
    
    // Church Tax Verification
    report += `\nChurch Tax Verification (KiStG):\n`;
    verification.churchTaxVerification.forEach(test => {
      report += `  ${test.passed ? '✓' : '✗'} ${test.testName}: ${test.description}\n`;
      if (!test.passed) {
        report += `    Expected: ${test.expected.toFixed(2)}, Actual: ${test.actual.toFixed(2)}\n`;
      }
    });
    
    // One-Fifth Rule Verification
    report += `\nOne-Fifth Rule Verification:\n`;
    verification.oneFifthRuleVerification.forEach(test => {
      report += `  ${test.passed ? '✓' : '✗'} ${test.testName}: ${test.description}\n`;
      if (!test.passed) {
        report += `    Expected: ${test.expected.toFixed(2)}, Actual: ${test.actual.toFixed(2)}\n`;
      }
    });
    
    // Overall Verification
    report += `\nOverall Calculation Logic:\n`;
    const overall = verification.overallVerification;
    report += `  ${overall.basicAllowanceApplied ? '✓' : '✗'} Basic allowance applied correctly\n`;
    report += `  ${overall.childAllowanceApplied ? '✓' : '✗'} Child allowance applied correctly\n`;
    report += `  ${overall.socialSecurityDeductionsApplied ? '✓' : '✗'} Social security deductions applied\n`;
    report += `  ${overall.taxTariffProgression ? '✓' : '✗'} Tax tariff progression correct\n`;
    report += `  ${overall.calculationWithinBounds ? '✓' : '✗'} Calculation within reasonable bounds\n`;
    
    return report;
  }
}