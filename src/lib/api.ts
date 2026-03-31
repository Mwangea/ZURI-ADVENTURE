export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  credentials?: RequestCredentials;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, credentials = 'include' } = options;

  const headers: Record<string, string> = {};
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body != null && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials,
    body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const json = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = json?.error?.message ?? `Request failed with ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (json ?? {}) as T;
}

