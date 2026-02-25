import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  token?: string | null;
  headers?: Record<string, string | undefined>;
};

export async function apiFetch<T>(
  path: string,
  { token, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(joinUrl(API_BASE_URL, path), {
    ...init,
    headers: {
      ...(init.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await readBody(res);

  if (!res.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in (body as any)
        ? (body as any).detail
        : undefined;
    const message =
      typeof detail === 'string'
        ? detail
        : typeof body === 'string'
          ? body
          : 'Ошибка запроса';
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

