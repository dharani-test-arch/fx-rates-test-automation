import { useQuery } from '@apollo/client';
import { GET_RATES } from '../queries';

type Rate = { currency: string; rate: number };
type Props = { base: string; filter: string };

export function RatesList({ base, filter }: Props) {
  const { loading, error, data } = useQuery<{ rates: Rate[] }>(GET_RATES, {
    variables: { currency: base },
  });

  if (loading) {
    return (
      <p data-testid="loading" role="status">
        Loading rates…
      </p>
    );
  }

  if (error) {
    return (
      <p data-testid="error" role="alert">
        Rates could not be loaded. Check your connection and try again.
      </p>
    );
  }

  const term = filter.trim().toLowerCase();
  const rows = (data?.rates ?? []).filter((r) => r.currency.toLowerCase().includes(term));

  if (rows.length === 0) {
    return (
      <p data-testid="empty">
        No currencies match “{filter}”. Try a different code.
      </p>
    );
  }

  return (
    <table className="rates" data-testid="rates-table">
      <thead>
        <tr>
          <th scope="col">Currency</th>
          <th scope="col">1 {base} =</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.currency} data-testid="rate-row" data-currency={r.currency}>
            <td data-testid="rate-currency">{r.currency}</td>
            <td data-testid="rate-value">{r.rate.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
