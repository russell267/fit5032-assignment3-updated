
const isHosting =
  location.hostname.endsWith('web.app') ||
  location.hostname.endsWith('firebaseapp.com') ||
  ((location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    (location.port === '5005' || location.port === '5015' || location.port === '5025'));


const DEFAULT_FN_BASE = 'http://127.0.0.1:5007/week8-jiaquan/us-central1';


const ENV_BASE = (import.meta.env.VITE_FUNCTIONS_URL || '').replace(/\/$/, '');


const BASE = isHosting ? '' : (ENV_BASE || DEFAULT_FN_BASE);


export const API_BASE = BASE + '/api';
export const SEED_BASE = BASE;


console.log('[config.js] isHosting:', isHosting, 'BASE:', BASE, 'API_BASE:', API_BASE);
