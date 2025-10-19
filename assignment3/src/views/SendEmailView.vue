<template>
  <div class="page">

    <div class="hero">
      <h1>Men s Health Email Center</h1>
      <p>Communicate, inspire, and promote health awareness efficiently.</p>
    </div>


    <div class="card">
      <h2 class="card-title">
        <span class="icon">email</span>
        Send Email
      </h2>

      <div class="form space-y-5">
        <!-- Recipients -->
        <div>
          <label class="label">Recipients</label>
          <input
            v-model.trim="form.to"
            class="input"
            placeholder="e.g., user@domain.com, team@domain.com"
          />
        </div>

        <!-- Subject -->
        <div>
          <label class="label">Subject</label>
          <input
            v-model.trim="form.subject"
            class="input"
            placeholder="Men s Health Newsletter"
          />
        </div>

        <!-- Content -->
        <div>
          <label class="label">Message</label>
          <textarea
            v-model.trim="form.text"
            rows="6"
            class="input textarea"
            placeholder="Write your message to promote health awareness..."
          ></textarea>
        </div>

        <!-- Attachments -->
        <div>
          <label class="label">Attachments</label>
          <div class="upload-box" @click="$refs.fileInput.click()">
            <input ref="fileInput" type="file" multiple class="hidden" @change="onFiles" />
            <p><i class="fas fa-paperclip"></i> Click to select or drag files here</p>
          </div>
          <ul v-if="files.length" class="file-list">
            <li v-for="f in files" :key="f.name">
              <span>{{ f.name }}</span>
              <span>{{ (f.size / 1024).toFixed(1) }} KB</span>
            </li>
          </ul>
        </div>

        <!-- Buttons -->
        <div class="btn-group">
          <button class="btn primary" @click="send" :disabled="loading">
            <i class="fas fa-paper-plane"></i>
            {{ loading ? 'Sending...' : 'Send Email' }}
          </button>
          <button class="btn ghost" @click="resetForm">
            <i class="fas fa-rotate-left"></i> Reset
          </button>
        </div>

        <!-- Message -->
        <p v-if="message" :class="ok ? 'msg ok' : 'msg err'">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { sendMail, debugApiBase } from '@/api'

type Att = { filename?: string; contentBase64?: string; type?: string }

const form = ref({ to: '', subject: '', text: '' })
const files = ref<File[]>([])
const loading = ref(false)
const message = ref('')
const ok = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

console.log('API BASE:', debugApiBase())

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  files.value = Array.from(input.files || [])
}

function fileToBase64(file: File): Promise<Att> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes('base64,') ? result.split('base64,')[1] : result
      resolve({
        filename: file.name,
        type: file.type || 'application/octet-stream',
        contentBase64: base64
      })
    }
    reader.onerror = () => reject(reader.error || new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

async function send() {
  message.value = ''
  ok.value = false

  if (!form.value.to || !form.value.subject || !form.value.text) {
    message.value = 'Please fill in all required fields.'
    return
  }

  loading.value = true
  try {
    const attachments: Att[] = await Promise.all(files.value.map(fileToBase64))
    const success = await sendMail({
      to: form.value.to,
      subject: form.value.subject,
      text: form.value.text,
      attachments
    })
    ok.value = success
    message.value = success ? 'Email sent successfully!' : 'Failed to send email.'
  } catch (err: any) {
    message.value = `Error: ${err?.message || err}`
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = { to: '', subject: '', text: '' }
  files.value = []
  message.value = ''
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');


.page {
  min-height: 100vh;
  padding: 36px 20px 64px;
  background: #f8fafc;
}


.hero {
  max-width: 960px;
  margin: 0 auto 32px;
  padding: 28px 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #111827 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(30, 58, 138, 0.25);
  text-align: center;
}
.hero h1 {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px;
}
.hero p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}


.card {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.06);
  padding: 24px 28px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e3a8a;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 18px;
}
.icon { font-size: 18px; }


.label {
  display: block;
  font-weight: 600;
  font-size: 13px;
  color: #1e3a8a;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  transition: 0.2s;
}
.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}
.textarea {
  min-height: 120px;
  resize: vertical;
}


.upload-box {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.25s;
}
.upload-box:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #f0f9ff;
}
.upload-box i {
  color: #2563eb;
  margin-right: 6px;
}
.file-list {
  margin-top: 8px;
  font-size: 13px;
  color: #334155;
}
.file-list li {
  display: flex;
  justify-content: space-between;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-bottom: 4px;
}


.btn-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}
.btn {
  border: none;
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn.primary {
  background: #1e3a8a;
  color: white;
  box-shadow: 0 6px 14px rgba(30, 58, 138, 0.25);
}
.btn.primary:hover {
  background: #2a50b1;
}
.btn.ghost {
  background: white;
  color: #1e3a8a;
  border: 1px solid #cbd5e1;
}
.btn.ghost:hover {
  background: #f8fafc;
}


.msg {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
}
.msg.ok {
  color: #059669;
}
.msg.err {
  color: #dc2626;
}
</style>
