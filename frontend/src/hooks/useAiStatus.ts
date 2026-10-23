import { useEffect, useState } from 'react';
import { getApiUrl } from '../services/authService';

export type AiStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE';

export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>('CHECKING');

  useEffect(() => {
    let cancelled = false;
    fetch(getApiUrl('/health/ai'))
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatus(data?.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE');
      })
      .catch(() => {
        if (!cancelled) setStatus('OFFLINE');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
