// src/api.ts
import axios from 'axios';




const FIXED_BASE_URL = 'http://127.0.0.1:5007/week8-jiaquan/us-central1';


const ENV_BASE =
  (import.meta.env.VITE_FUNCTIONS_URL as string | undefined)?.replace(/\/$/, '') ?? '';


const BASE = ENV_BASE || FIXED_BASE_URL;


export const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});


function normalizeError(e: any) {
  const msg =
    e?.response?.data?.error ||
    e?.response?.data ||
    e?.message ||
    'Request failed';
  return new Error(String(msg));
}


export function debugApiBase() {
  return {
    baseURLUsed: BASE,
    defaultEmulator: FIXED_BASE_URL,
    envBase: ENV_BASE || '(none)',
  };
}


export async function fetchBookCount(): Promise<number> {
  try {
    const { data } = await api.get('/countBooks');
    return data.count;
  } catch (e) {
    throw normalizeError(e);
  }
}


export async function sendMail(payload: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename?: string;
    contentBase64?: string;
    type?: string;
  }>;
}): Promise<boolean> {
  try {
    const { data } = await api.post('/sendEmail', payload);
    return data?.ok === true;
  } catch (e) {
    throw normalizeError(e);
  }
}


export async function getGeocode(params: {
  q: string;
  limit?: number;
  proximity?: string; // "lng,lat"
}) {
  try {
    const { data } = await api.get('/map/geocode', { params });
    return data;
  } catch (e) {
    throw normalizeError(e);
  }
}


export async function getRoute(params: {
  from: string; // "lng,lat"
  to: string;   // "lng,lat"
  profile?: 'walking' | 'driving' | 'cycling';
}) {
  try {
    const { data } = await api.get('/map/route', { params });
    return data;
  } catch (e) {
    throw normalizeError(e);
  }
}
(window as any).debugApiBase = debugApiBase;
