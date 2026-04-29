/** Centralised API client for AOMS backend (no-auth pass).
 *  Base URL resolves from VITE_API_URL env var or defaults to localhost:3000.
 */
const BASE =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export interface ApiMeta {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface ApiResult<T> {
  status:  string;
  message: string;
  data:    T;
  meta?:   ApiMeta;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json as ApiResult<T>;
}

export const api = {
  get:   <T>(path: string)                 => request<T>(path),
  post:  <T>(path: string, body: unknown)  => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:   <T>(path: string, body: unknown)  => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  del:   <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
};
