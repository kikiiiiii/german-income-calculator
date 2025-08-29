import React, { useState } from 'react';
import { TaxFormData, TaxCalculationResult } from '../types/tax';
import { FEDERAL_STATES } from '../utils/taxCalculator';
import './TaxForm.css';

interface TaxFormProps {
  onCalculate: (data: TaxFormData) => void;
  result?: TaxCalculationResult;
}

export default function TaxForm({ onCalculate, result }: TaxFormProps) {
  const [formData, setFormData] = useState<Partial<TaxFormData>>({
    taxYear: 2025,
    taxClass: 1,
    maritalStatus: 'single',
    jointAssessment: false,
    numberOfChildren: 0,
    churchMembership: false,
    federalState: 'Bayern',
    socialSecurityStatus: 'statutory',
    additionalContributionRate: 1.6,
    freibetrag: 0,
  });

  const [showDetails, setShowDetails] = useState<boolean>(false);

  
  const handleInputChange = (field: keyof TaxFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Create a complete data object with default values for missing fields
    const completeData: TaxFormData = {
      taxYear: formData.taxYear || 2025,
      taxClass: formData.taxClass || 1,
      maritalStatus: formData.maritalStatus || 'single',
      jointAssessment: formData.jointAssessment || false,
      numberOfChildren: formData.numberOfChildren || 0,
      churchMembership: formData.churchMembership || false,
      federalState: formData.federalState || 'Bayern',
      socialSecurityStatus: formData.socialSecurityStatus || 'statutory',
      additionalContributionRate: formData.additionalContributionRate || 1.6,
      freibetrag: formData.freibetrag || 0,
      periodsWithoutEntitlement: formData.periodsWithoutEntitlement || 0,
      grossSalary: formData.grossSalary || 0,
      withheldIncomeTax: formData.withheldIncomeTax || 0,
      withheldSolidaritySurcharge: formData.withheldSolidaritySurcharge || 0,
      withheldChurchTax: formData.withheldChurchTax || 0,
      taxFreeReimbursements: formData.taxFreeReimbursements || 0,
      flat15TaxedReimbursements: formData.flat15TaxedReimbursements || 0,
      oneFifthPayment: formData.oneFifthPayment || 0,
      employerPensionContributions: formData.employerPensionContributions || 0,
      employeePensionContributions: formData.employeePensionContributions || 0,
      taxFreeEmployerSubsidies: formData.taxFreeEmployerSubsidies || 0,
      employeeHealthInsurance: formData.employeeHealthInsurance || 0,
      employeeLongTermCareInsurance: formData.employeeLongTermCareInsurance || 0,
      employeeUnemploymentInsurance: formData.employeeUnemploymentInsurance || 0,
    };
    
    console.log('Complete data with defaults:', completeData);
    
    if (isValidFormData(formData)) {
      onCalculate(completeData);
    } else {
      console.log('Form validation failed. Missing required fields.');
      alert('Please fill in all required fields, especially Gross Salary and Withheld Income Tax.');
    }
  };

  
  const isValidFormData = (data: Partial<TaxFormData>): data is TaxFormData => {
    return !!(
      data.taxYear &&
      data.taxClass &&
      data.maritalStatus &&
      data.jointAssessment !== undefined &&
      data.numberOfChildren !== undefined &&
      data.churchMembership !== undefined &&
      data.federalState &&
      data.socialSecurityStatus &&
      data.additionalContributionRate !== undefined &&
      data.freibetrag !== undefined &&
      data.grossSalary !== undefined && data.grossSalary >= 0 &&
      data.withheldIncomeTax !== undefined && data.withheldIncomeTax >= 0 &&
      (data.withheldSolidaritySurcharge === undefined || data.withheldSolidaritySurcharge >= 0) &&
      (data.withheldChurchTax === undefined || data.withheldChurchTax >= 0)
    );
  };

  return (
    <div className="tax-form-container">
      <form onSubmit={handleSubmit} className="tax-form">
        <h2>German Income Tax Calculator</h2>
        
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tax Year</label>
              <select
                value={formData.taxYear || ''}
                onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Tax Class</label>
              <select
                value={formData.taxClass || ''}
                onChange={(e) => handleInputChange('taxClass', parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
              >
                <option value={1}>I</option>
                <option value={2}>II</option>
                <option value={3}>III</option>
                <option value={4}>IV</option>
                <option value={5}>V</option>
                <option value={6}>VI</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Marital Status</label>
              <select
                value={formData.maritalStatus || ''}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value as any)}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.jointAssessment || false}
                  onChange={(e) => handleInputChange('jointAssessment', e.target.checked)}
                />
                Joint Assessment
              </label>
            </div>
            
            <div className="form-group">
              <label>Number of Children</label>
              <input
                type="number"
                min="0"
                value={formData.numberOfChildren || ''}
                onChange={(e) => handleInputChange('numberOfChildren', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.churchMembership || false}
                  onChange={(e) => handleInputChange('churchMembership', e.target.checked)}
                />
                Church Member
              </label>
            </div>
            
            <div className="form-group">
              <label>Federal State</label>
              <select
                value={formData.federalState || ''}
                onChange={(e) => handleInputChange('federalState', e.target.value)}
              >
                {FEDERAL_STATES.map(state => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Income Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Gross Salary (€)<small>Line 3: Bruttoarbeitslohn einschl. Sachbezüge ohne 9. und 10.</small></label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.grossSalary || ''}
                onChange={(e) => handleInputChange('grossSalary', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Periods without Entitlement<small>Line 2: Zeiträume ohne Anspruch auf Arbeitslohn</small></label>
              <input
                type="number"
                value={formData.periodsWithoutEntitlement || ''}
                onChange={(e) => handleInputChange('periodsWithoutEntitlement', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="form-group">
              <label>Tax-free Reimbursements (€)<small>Line 17: Steuerfreie Arbeitgeberleistungen, die auf die Entfernungspauschale anzurechnen sind</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.taxFreeReimbursements || ''}
                onChange={(e) => handleInputChange('taxFreeReimbursements', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>15% Taxed Reimbursements (€)<small>Line 18: Pauschal mit 15% besteuerte Arbeitgeberleistungen für Fahrten zwischen Wohnung und 1. Tätigkeitsstätte</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.flat15TaxedReimbursements || ''}
                onChange={(e) => handleInputChange('flat15TaxedReimbursements', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>One-Fifth Payment (€)<small>Line 10: Arbeitslohn für mehrere Kalenderjahre, Entschädigungen, z.B. Abfindungen</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.oneFifthPayment || ''}
                onChange={(e) => handleInputChange('oneFifthPayment', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <div className="field-help">
                <small>
                  Severance payments or compensation subject to the one-fifth taxation rule. 
                  Only 1/5 of this amount is added to taxable income in the current year.
                  <a href="https://www.bmf-steuerrechner.de/info/est/fuenftelregelung.html" 
                     target="_blank" rel="noopener noreferrer">
                    Learn more about the one-fifth rule
                  </a>
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Withheld Taxes</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Income Tax Withheld (€)<small>Line 4: Einbehaltene Lohnsteuer von 3</small></label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.withheldIncomeTax || ''}
                onChange={(e) => handleInputChange('withheldIncomeTax', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Solidarity Surcharge Withheld (€)<small>Line 5: Einbehaltener Solidaritätszuschlag von 3</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.withheldSolidaritySurcharge || ''}
                onChange={(e) => handleInputChange('withheldSolidaritySurcharge', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Church Tax Withheld (€)<small>Line 6: Einbehaltene Kirchensteuer des Arbeitnehmers von 3</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.withheldChurchTax || ''}
                onChange={(e) => handleInputChange('withheldChurchTax', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Social Security Contributions</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Employer Pension Contributions (€)<small>Line 22: Arbeitgeberanteil -zuschuss zur gesetzlichen Rentenversicherung</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.employerPensionContributions || ''}
                onChange={(e) => handleInputChange('employerPensionContributions', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Employee Pension Contributions (€)<small>Line 23: Arbeitnehmeranteil zur gesetzlichen Rentenversicherung / berufsständische Versorgungseinrichtungen</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.employeePensionContributions || ''}
                onChange={(e) => handleInputChange('employeePensionContributions', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Tax-free Employer Subsidies (€)<small>Line 24: Steuerfreie Arbeitgeberzuschüsse a) gesetzliche Krankenversicherung b) private Krankenversicherung c) gesetzliche Pflegeversicherung</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.taxFreeEmployerSubsidies || ''}
                onChange={(e) => handleInputChange('taxFreeEmployerSubsidies', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Employee Health Insurance (€)<small>Line 25: Arbeitnehmerbeiträge zur gesetzlichen Krankenversicherung</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.employeeHealthInsurance || ''}
                onChange={(e) => handleInputChange('employeeHealthInsurance', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Employee Long-term Care Insurance (€)<small>Line 26: Arbeitnehmerbeiträge zur sozialen Pflegeversicherung</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.employeeLongTermCareInsurance || ''}
                onChange={(e) => handleInputChange('employeeLongTermCareInsurance', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label>Employee Unemployment Insurance (€)<small>Line 27: Arbeitnehmerbeiträge zur Arbeitslosenversicherung</small></label>
              <input
                type="number"
                step="0.01"
                value={formData.employeeUnemploymentInsurance || ''}
                onChange={(e) => handleInputChange('employeeUnemploymentInsurance', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Social Security Status</label>
              <select
                value={formData.socialSecurityStatus || ''}
                onChange={(e) => handleInputChange('socialSecurityStatus', e.target.value as any)}
              >
                <option value="statutory">Statutory</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>
                Additional Contribution Rate (%)
                <small>Zusatzbeitragssatz zur Krankenversicherung</small>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.additionalContributionRate || ''}
                onChange={(e) => handleInputChange('additionalContributionRate', parseFloat(e.target.value) || 0)}
                placeholder="1.6"
              />
              <div className="field-help">
                <small>
                  This is the additional health insurance contribution rate set by your health insurance provider. 
                  Default is 1.6%. Check your insurance documents or contact your provider.
                  <a href="https://www.bundesgesundheitsministerium.de/themen/krankenversicherung/zusatzbeitrag.html" 
                     target="_blank" rel="noopener noreferrer">
                    Learn more about Zusatzbeitrag
                  </a>
                </small>
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Freibetrag (€)
                <small>Steuerfreibetrag vom Finanzamt</small>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.freibetrag || ''}
                onChange={(e) => handleInputChange('freibetrag', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <div className="field-help">
                <small>
                  Tax exemption allowance granted by the tax office. This is set in your ELStAM electronic tax card.
                  Leave as 0 if you don't have a specific Freibetrag.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="calculate-button">Calculate Tax</button>
        </div>
      </form>

      {result && (
        <div className="tax-result">
          <h3>Tax Calculation Result</h3>
          <div className="field-help">
            <small>
              <strong>Understanding Your Results:</strong> This calculator shows your theoretical tax liability based on current tax law. 
              Compare this with your actual withheld taxes to determine if you'll receive a refund or need to make additional payment.
            </small>
          </div>
          <div className="result-grid">
            <div className="result-item">
              <label>Taxable Income (zvE):</label>
              <span>€{result.taxableIncome.toFixed(2)}</span>
              <small>Rounded down to full €</small>
            </div>
            <div className="result-item">
              <label>Calculated Income Tax (TAX(zvE)):</label>
              <span>
                €{(
                  (result.oneFifthRuleAmount && result.oneFifthRuleAmount > 0)
                    ? (result.taxOnZvE ?? result.incomeTax)
                    : result.incomeTax
                ).toFixed(2)}
              </span>
            </div>
            {result.oneFifthRuleAmount > 0 && (
              <>
                <button type="button" className="details-toggle" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? 'Hide severance details' : 'Show severance details'}
                </button>
                {showDetails && (
                  <>
                    <div className="result-item">
                      <label>One-fifth amount:</label>
                      <span>€{result.oneFifthRuleAmount.toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>Severance tax impact:</label>
                      <span>€{result.severanceTaxImpact.toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>zvE_base (excl. severance):</label>
                      <span>€{(result.zvEBase ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>ESt1 (TAX(zvE_base)):</label>
                      <span>€{(result.estBaseTax ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>ESt2 (TAX(zvE_base + 1/5 severance)):</label>
                      <span>€{(result.estWithOneFifth ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>Δ (ESt2 − ESt1):</label>
                      <span>€{(result.severanceDelta ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <label>Effective rate on severance:</label>
                      <span>
                        {result.oneFifthRuleAmount > 0
                          ? ((result.severanceTaxImpact / (result.oneFifthRuleAmount * 5)) * 100).toFixed(2)
                          : '0.00'}%
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
            {result.oneFifthRuleAmount > 0 && (
              <div className="result-item">
                <label>Calculated Income Tax (with one-fifth rule):</label>
                <span>€{result.incomeTax.toFixed(2)}</span>
              </div>
            )}
            <div className="result-item">
              <label>Solidarity Surcharge:</label>
              <span>€{result.solidaritySurcharge.toFixed(2)}</span>
              <small>5.5% of income tax (subject to thresholds)</small>
            </div>
            <div className="result-item">
              <label>Church Tax:</label>
              <span>€{result.churchTax.toFixed(2)}</span>
              <small>8% or 9% of income tax depending on state</small>
            </div>
            <div className="result-item">
              <label>Total Liability:</label>
              <span>€{result.totalLiability.toFixed(2)}</span>
            </div>
            <div className="result-item">
              <label>Actual Withheld Taxes:</label>
              <span>€{result.withheldTaxes.toFixed(2)}</span>
              <small>Sum of lines 4, 5, and 6 from income certificate</small>
            </div>
            <div className={`result-item final ${result.isRefund ? 'refund' : 'payment'}`}>
              <label>{result.isRefund ? 'Tax Refund' : 'Additional Payment Due'}:</label>
              <span>€{Math.abs(result.refundOrPayment).toFixed(2)}</span>
              <small>{result.isRefund ? 'You will receive this amount' : 'You need to pay this amount'}</small>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}