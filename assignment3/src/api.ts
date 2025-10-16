import axios from 'axios';
const baseURL = import.meta.env.VITE_FUNCTIONS_URL ?? 'http://127.0.0.1:5002'; // emulator
export const api = axios.create({ baseURL });


export async function fetchBookCount() {
  const { data } = await api.get('/countBooks');
  return data.count;
}


export async function sendMail(payload: {to:string; subject:string; text:string}) {
  const { data } = await api.post('/sendEmail', payload);
  return data.ok;
}
