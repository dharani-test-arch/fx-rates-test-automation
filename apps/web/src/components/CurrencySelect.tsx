import { useQuery } from '@apollo/client';
import { GET_CURRENCIES } from '../queries';

type Props = { value: string; onChange: (currency: string) => void };

export function CurrencySelect({ value, onChange }: Props) {
  const { data, error } = useQuery<{ currencies: string[] }>(GET_CURRENCIES);

  return (
    <label className="field">
      <span>Base currency</span>
      <select
        data-testid="currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!data && !error}
      >
        {(data?.currencies ?? [value]).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
