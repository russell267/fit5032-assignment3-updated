<template>
  <div class="max-w-xl mx-auto p-6 space-y-4">
    <h1 class="text-2xl font-bold">Send Email</h1>

    <div>
      <label class="block text-sm mb-1">To</label>
      <input
        v-model.trim="form.to"
        class="border rounded w-full p-2"
        placeholder="user@x.com, other@y.com"
      />
    </div>

    <div>
      <label class="block text-sm mb-1">Subject</label>
      <input v-model.trim="form.subject" class="border rounded w-full p-2" />
    </div>

    <div>
      <label class="block text-sm mb-1">Content (Text)</label>
      <textarea v-model.trim="form.text" rows="6" class="border rounded w-full p-2"></textarea>
    </div>

    <div>
      <label class="block text-sm mb-1">Attachments</label>
      <input type="file" multiple @change="onFiles" />
      <ul class="text-xs text-gray-600 mt-1" v-if="files.length">
        <li v-for="f in files" :key="f.name">{{ f.name }} ({{ (f.size/1024).toFixed(1) }} KB)</li>
      </ul>
    </div>

    <button
      :disabled="loading"
      @click="send"
      class="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {{ loading ? 'Sending...' : 'Send' }}
    </button>

    <p v-if="message" :class="ok ? 'text-green-600' : 'text-red-600'">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sendMail, debugApiBase } from '@/api';

type Att = { filename?: string; contentBase64?: string; type?: string };

const form = ref<{ to: string; subject: string; text: string }>({
  to: '',
  subject: '',
  text: ''
});
const files = ref<File[]>([]);
const loading = ref(false);
const message = ref('');
const ok = ref(false);


console.log('API BASE:', debugApiBase());

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  files.value = Array.from(input.files || []);
}

function fileToBase64(file: File): Promise<Att> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {

      const result = String(reader.result || '');
      const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;
      resolve({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        contentBase64: base64
      });
    };
    reader.onerror = () => reject(reader.error || new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

async function send() {
  message.value = '';
  ok.value = false;

  if (!form.value.to || !form.value.subject || !form.value.text) {
    message.value = 'Please fill in: To / Subject / Content';
    return;
  }

  loading.value = true;
  try {
    const attachments: Att[] = await Promise.all(files.value.map(fileToBase64));


    const success = await sendMail({
      to: form.value.to,
      subject: form.value.subject,
      text: form.value.text,
      attachments
    });

    ok.value = success;
    message.value = success ? 'send successful' : 'failed: unknown';
  } catch (err: any) {
    message.value = `failed: ${err?.message || err}`;
  } finally {
    loading.value = false;
  }
}
</script>
