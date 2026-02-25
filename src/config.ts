export const API_BASE_URL = 'https://wishlist-backend-8rai.onrender.com';

// Домен сайта (как на wishlist-frontend). По этой ссылке открывается сайт и, при настроенных Universal Links, приложение.
export const WEB_BASE_URL = 'https://wishlist-frontend-xi.vercel.app';

export const STORAGE_KEYS = {
  token: 'wishlist_token',
  user: 'wishlist_user',
} as const;

export function getWsBaseUrl(apiBaseUrl: string = API_BASE_URL): string {
  const u = apiBaseUrl.replace(/\/$/, '');
  if (u.startsWith('https://')) return `wss://${u.slice('https://'.length)}`;
  if (u.startsWith('http://')) return `ws://${u.slice('http://'.length)}`;
  if (u.startsWith('ws://') || u.startsWith('wss://')) return u;
  return u;
}

