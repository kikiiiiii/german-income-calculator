import { useState } from 'react';
import TaxForm from './components/TaxForm';
import { TaxFormData, TaxCalculationResult } from './types/tax';
import { calculateTax } from './utils/taxCalculator';
import './App.css';

function App() {
  const [result, setResult] = useState<TaxCalculationResult | undefined>();

  const handleCalculate = (data: TaxFormData) => {
    const calculationResult = calculateTax(data);
    setResult(calculationResult);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>German Income Tax Calculator</h1>
        <p>Calculate your German income tax with precision</p>
      </header>
      <main>
        <TaxForm onCalculate={handleCalculate} result={result} />
      </main>
    </div>
  );
}

export default App;
