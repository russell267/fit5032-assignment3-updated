<template>
  <div class="max-w-xl mx-auto p-6 space-y-4">
    <h1 class="text-2xl font-bold">Send Email</h1>

    <div>
      <label class="block text-sm mb-1">To be more</label>
      <input v-model="form.to" class="border rounded w-full p-2" placeholder="user@x.com, other@y.com" />
    </div>

    <div>
      <label class="block text-sm mb-1">Subject</label>
      <input v-model="form.subject" class="border rounded w-full p-2" />
    </div>

    <div>
      <label class="block text-sm mb-1">Content (Text)</label>
      <textarea v-model="form.text" rows="6" class="border rounded w-full p-2"></textarea>
    </div>

    <div>
      <label class="block text-sm mb-1">Attachments</label>
      <input type="file" multiple @change="onFiles" />
      <ul class="text-xs text-gray-600 mt-1">
        <li v-for="f in files" :key="f.name">{{ f.name }} ({{ (f.size/1024).toFixed(1) }} KB)</li>
      </ul>
    </div>

    <button :disabled="loading" @click="send" class="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
      {{ loading ? 'Sending…' : 'Send' }}
    </button>

    <p v-if="message" :class="ok ? 'text-green-600' : 'text-red-600'">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';


const LOCAL_FN = 'http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/sendEmail';

const API = import.meta.env.VITE_SEND_EMAIL_URL || LOCAL_FN;

const form = ref({ to: '', subject: '', text: '' });
const files = ref([]);
const loading = ref(false);
const message = ref('');
const ok = ref(false);

function onFiles(e) {
  files.value = Array.from(e.target.files || []);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {

      const base64 = String(reader.result).split(',')[1];
      resolve({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        contentBase64: base64,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function send() {
  message.value = '';
  ok.value = false;

  if (!form.value.to || !form.value.subject || !form.value.text) {
    message.value = 'try to fill out / Subject / Content';
    return;
  }

  loading.value = true;
  try {

    const attachments = await Promise.all(files.value.map(fileToBase64));

    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: form.value.to,
        subject: form.value.subject,
        text: form.value.text,

        attachments,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.error || 'Send failed');

    ok.value = true;
    message.value = '发送成功！';

  } catch (err) {
    message.value = `发送失败：${err.message}`;
  } finally {
    loading.value = false;
  }
}
</script>
