import { useCallback, useEffect, useState } from 'react';
import { loadBankingData } from '@/services/bankingApi';
import type { BankingData } from '@/types/banking';

export function useBankingData() {
  const [data, setData] = useState<BankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadBankingData());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
