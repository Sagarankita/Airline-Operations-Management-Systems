import { useState, useEffect } from 'react';
import { api } from './api';
import { session } from './session';

/**
 * Fetches the logged-in user's real name from the backend (employees or passengers).
 * Caches the result in sessionStorage so subsequent renders are instant.
 */
export function useUserName(fallback = 'User'): string {
  const [name, setName] = useState<string>(
    sessionStorage.getItem('displayName') ??
    sessionStorage.getItem('userEmail')?.split('@')[0] ??
    fallback
  );

  useEffect(() => {
    if (sessionStorage.getItem('displayName')) return;
    const empId       = session.getEmpId();
    const passengerId = session.getPassengerId();

    if (empId) {
      api.get<any>(`/employees/${empId}`)
        .then(res => {
          const n = res.data?.name;
          if (n) { sessionStorage.setItem('displayName', n); setName(n); }
        })
        .catch(() => {});
    } else if (passengerId) {
      api.get<any>(`/passengers/${passengerId}`)
        .then(res => {
          const n = res.data?.name;
          if (n) { sessionStorage.setItem('displayName', n); setName(n); }
        })
        .catch(() => {});
    }
  }, []);

  return name;
}
