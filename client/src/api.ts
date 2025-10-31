export type ApiResponse<T> = { data?: T; error?: string };

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function api<T>(
  url: string,
  opts?: RequestInit & { auth?: boolean }
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const needsAuth = Boolean(opts?.auth);
  if (needsAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      return { error: 'Not authenticated' };
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  try {
    const res = await fetch(fullUrl, { ...opts, headers });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
    if (!res.ok) return { error: (json && (json.error || json.message)) || res.statusText || 'Error' };
    return { data: (json as T) };
  } catch(e) {
    return { error: 'Network error' };
  }
}
