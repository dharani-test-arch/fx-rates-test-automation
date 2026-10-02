import { useState } from 'react';
import { CurrencySelect } from './components/CurrencySelect';
import { RatesList } from './components/RatesList';

export default function App() {
  const [base, setBase] = useState('USD');
  const [filter, setFilter] = useState('');

  return (
    <main>
      <h1>Exchange rates</h1>
      <p className="lede">See what one unit of your base currency buys.</p>

      <div className="controls">
        <CurrencySelect value={base} onChange={setBase} />
        <label className="field">
          <span>Filter by code</span>
          <input
            data-testid="rate-filter"
            type="search"
            value={filter}
            placeholder="e.g. EUR"
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </div>

      <RatesList base={base} filter={filter} />
    </main>
  );
}
