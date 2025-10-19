<template>
  <div class="page">

    <!-- 顶部深蓝胶囊标题 -->
    <div class="hero">
      <h1>Men’s Health Email Center</h1>
      <p>Compose rich emails to engage your audience with wellness content.</p>
    </div>

    <!-- 写信卡片 -->
    <div class="card">
      <h2 class="card-title">
        <i class="fas fa-envelope-open-text"></i>
        New Message
      </h2>

      <div class="form space-y-5">

        <!-- 收件人行：To / Cc / Bcc -->
        <div class="addr">
          <div class="addr-row">
            <span class="addr-label">To</span>
            <input v-model.trim="to" class="addr-input" placeholder="name@domain.com, other@domain.com" />
            <div class="addr-actions">
              <button class="minibtn" @click="showCc = !showCc">Cc</button>
              <button class="minibtn" @click="showBcc = !showBcc">Bcc</button>
            </div>
          </div>
          <div v-if="showCc" class="addr-row mt-2">
            <span class="addr-label">Cc</span>
            <input v-model.trim="cc" class="addr-input" placeholder="Optional — comma separated" />
          </div>
          <div v-if="showBcc" class="addr-row mt-2">
            <span class="addr-label">Bcc</span>
            <input v-model.trim="bcc" class="addr-input" placeholder="Optional — comma separated" />
          </div>
        </div>

        <!-- 主题 -->
        <div>
          <input
            v-model.trim="subject"
            class="input subject"
            placeholder="Subject"
          />
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="left">
            <button class="tbtn" :title="'Undo'" @click="exec('undo')"><i class="fas fa-rotate-left"></i></button>
            <button class="tbtn" :title="'Redo'" @click="exec('redo')"><i class="fas fa-rotate-right"></i></button>
            <div class="sep"></div>

            <select class="tselect" v-model="fontName" @change="exec('fontName', fontName)">
              <option value="Sans Serif">Sans Serif</option>
              <option value="Serif">Serif</option>
              <option value="Monospace">Monospace</option>
            </select>
            <select class="tselect" v-model="fontSize" @change="exec('fontSize', fontSize)">
              <option value="3">Normal</option>
              <option value="4">Large</option>
              <option value="5">Larger</option>
              <option value="6">Huge</option>
            </select>
            <div class="sep"></div>

            <button class="tbtn" :title="'Bold'" @click="exec('bold')"><i class="fas fa-bold"></i></button>
            <button class="tbtn" :title="'Italic'" @click="exec('italic')"><i class="fas fa-italic"></i></button>
            <button class="tbtn" :title="'Underline'" @click="exec('underline')"><i class="fas fa-underline"></i></button>
            <button class="tbtn" :title="'Remove formatting'" @click="exec('removeFormat')"><i class="fas fa-eraser"></i></button>
            <div class="sep"></div>

            <label class="colorpick" :title="'Textcolor'">
              <i class="fas fa-font"></i>
              <input type="color" v-model="foreColor" @input="exec('foreColor', foreColor)" />
            </label>
            <label class="colorpick" :title="'Highlight'">
              <i class="fas fa-highlighter"></i>
              <input type="color" v-model="backColor" @input="exec('hiliteColor', backColor)" />
            </label>
            <div class="sep"></div>

            <button class="tbtn" :title="'Bulleted list'" @click="exec('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            <button class="tbtn" :title="'Numbered list'" @click="exec('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
            <div class="sep"></div>

            <button class="tbtn" :title="'Align left'" @click="exec('justifyLeft')"><i class="fas fa-align-left"></i></button>
            <button class="tbtn" :title="'Center'" @click="exec('justifyCenter')"><i class="fas fa-align-center"></i></button>
            <button class="tbtn" :title="'Align right'" @click="exec('justifyRight')"><i class="fas fa-align-right"></i></button>
            <div class="sep"></div>

            <button class="tbtn" :title="'Insert link'" @click="insertLink"><i class="fas fa-link"></i></button>
            <button class="tbtn" :title="'Insert emoji 🙂'" @click="insertEmoji">🙂</button>
          </div>

          <div class="right">
            <button class="tbtn ghost" @click="toggleHtml">{{ showHtml ? 'Rich' : 'HTML' }}</button>
          </div>
        </div>

        <!-- 富文本编辑器 / HTML 切换 -->
        <div v-if="!showHtml" class="editor" contenteditable="true" ref="editorRef" @paste="onPaste"></div>
        <textarea v-else v-model="html" class="editor html"></textarea>

        <!-- 附件 -->
        <div>
          <label class="label">Attachments</label>
          <div class="upload-box" @click="$refs.fileInput?.click()">
            <input ref="fileInput" type="file" multiple class="hidden" @change="onFiles" />
            <p><i class="fas fa-paperclip"></i> Click to select or drag files here</p>
          </div>
          <ul v-if="files.length" class="file-list">
            <li v-for="f in files" :key="f.name">
              <span>{{ f.name }}</span>
              <span>{{ (f.size/1024).toFixed(1) }} KB</span>
            </li>
          </ul>
        </div>

        <!-- 底部发送按钮 -->
        <div class="sendbar">
          <button class="btn primary" @click="send" :disabled="loading">
            <i class="fas fa-paper-plane"></i>
            {{ loading ? 'Sending...' : 'Send' }}
          </button>
          <button class="btn ghost" @click="resetForm">
            <i class="fas fa-rotate-left"></i>
            Reset
          </button>
        </div>

        <!-- 发送结果 -->
        <p v-if="message" :class="ok ? 'msg ok' : 'msg err'">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { sendMail, debugApiBase } from '@/api'

type Att = { filename?: string; contentBase64?: string; type?: string }

console.log('API BASE:', debugApiBase())

/** 地址与邮件字段 */
const to = ref('')
const cc = ref('')
const bcc = ref('')
const showCc = ref(false)
const showBcc = ref(false)
const subject = ref('')

/** 富文本相关 */
const editorRef = ref<HTMLDivElement | null>(null)
const showHtml = ref(false)
const html = ref('')
const fontName = ref('Sans Serif')
const fontSize = ref('3')
const foreColor = ref('#0f172a')
const backColor = ref('#fff7ad')

/** 附件与状态 */
const files = ref<File[]>([])
const loading = ref(false)
const message = ref('')
const ok = ref(false)

onMounted(() => {
  // 初始化编辑器默认提示
  if (editorRef.value && !editorRef.value.innerHTML) {
    editorRef.value.innerHTML =
      `<p style="margin:0 0 8px;color:#64748b;">Write your message here...</p>`
  }
})

/** 工具函数：执行富文本命令（浏览器内置，简单稳妥） */
function exec(cmd: string, value?: any) {
  // 切回富文本视图
  if (showHtml.value) {
    showHtml.value = false
    nextTick(() => document.execCommand(cmd, false, value))
    return
  }
  document.execCommand(cmd, false, value)
  editorRef.value?.focus()
}

/** 粘贴为纯文本，避免带入奇怪样式 */
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

/** 链接与表情 */
function insertLink() {
  const url = prompt('Insert a link URL', 'https://')
  if (url) exec('createLink', url)
}
function insertEmoji() {
  exec('insertText', ' 🙂 ')
}

/** 切换 HTML 源码视图 */
function toggleHtml() {
  if (!showHtml.value) {
    html.value = editorRef.value?.innerHTML || ''
    showHtml.value = true
  } else {
    showHtml.value = false
    nextTick(() => {
      if (editorRef.value) editorRef.value.innerHTML = html.value || ''
    })
  }
}

/** 附件处理 */
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

/** 工具：收件人解析成数组 */
function splitEmails(s: string) {
  return (s || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
}

/** HTML -> 纯文本（发送备用） */
function htmlToText(h: string) {
  const div = document.createElement('div')
  div.innerHTML = h
  return div.textContent || div.innerText || ''
}

/** 发送邮件 */
async function send() {
  message.value = ''
  ok.value = false

  // 获取编辑器内容
  const bodyHtml = showHtml.value ? html.value : (editorRef.value?.innerHTML || '')
  const bodyText = htmlToText(bodyHtml).trim()

  if (!splitEmails(to.value).length || !subject.value || !bodyText) {
    message.value = 'Please fill in To / Subject / Message.'
    return
  }

  loading.value = true
  try {
    const attachments: Att[] = await Promise.all(files.value.map(fileToBase64))

    // 合并 To + Cc + Bcc 到 to（后端只收 to）
    const recipients = [
      ...splitEmails(to.value),
      ...splitEmails(cc.value),
      ...splitEmails(bcc.value),
    ]

    const success = await sendMail({
      to: recipients.join(','),
      subject: subject.value,
      text: bodyText,
      html: bodyHtml,
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

/** 重置 */
function resetForm() {
  to.value = ''
  cc.value = ''
  bcc.value = ''
  subject.value = ''
  if (editorRef.value) editorRef.value.innerHTML = ''
  html.value = ''
  files.value = []
  message.value = ''
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

/* 页面背景 */
.page { min-height: 100vh; padding: 32px 16px 64px; background: #f8fafc; }

/* 深蓝胶囊标题 */
.hero {
  max-width: 960px; margin: 0 auto 28px; padding: 26px 22px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #111827 100%);
  color: #fff; text-align: center;
  box-shadow: 0 12px 28px rgba(30,58,138,.25);
}
.hero h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing:.2px; }
.hero p { margin: 0; opacity:.9; font-size: 14px; }

/* 卡片 */
.card {
  max-width: 900px; margin: 0 auto; background: #fff;
  border: 1px solid #eef2f7; border-radius: 14px;
  box-shadow: 0 6px 18px rgba(2,6,23,.06); padding: 20px 22px;
}
.card-title {
  display: flex; align-items: center; gap: 10px; color:#1e3a8a;
  font-weight: 800; letter-spacing:.2px; font-size: 16px; margin-bottom: 12px;
}

/* 地址栏 */
.addr-row { display: flex; gap: 10px; align-items: center; }
.addr-label { min-width: 44px; color:#475569; font-weight:700; }
.addr-input {
  flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 12px; font-size: 14px;
}
.addr-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15); outline:none; }
.addr-actions { display: flex; gap: 6px; }
.minibtn {
  border: 1px dashed #cbd5e1; background: #fff; color:#1e3a8a;
  padding: 6px 10px; border-radius: 9999px; font-size: 12px; cursor: pointer;
}
.minibtn:hover { background:#f8fafc; }

/* 输入与主题 */
.input {
  width: 100%; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; transition:.2s;
}
.input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.15); outline:none; }
.subject { font-size: 16px; font-weight: 600; }

/* 工具栏 */
.toolbar {
  display:flex; align-items:center; justify-content:space-between;
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 6px; background:#fbfdff;
}
.toolbar .left { display:flex; align-items:center; gap:6px; flex-wrap: wrap; }
.toolbar .right { display:flex; gap:8px; }
.sep { width:1px; height:22px; background:#e5e7eb; margin:0 4px; }
.tbtn {
  border: 1px solid #e5e7eb; background:#fff; border-radius: 8px;
  padding: 6px 8px; cursor: pointer; font-size: 13px; color:#0f172a;
}
.tbtn:hover { background:#f3f4f6; }
.tbtn.ghost { background:#fff; }
.tselect {
  border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 8px; background:#fff; font-size: 13px;
}
.colorpick { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 0 6px; }
.colorpick input { width: 24px; height: 22px; border: none; background: transparent; padding: 0; }

/* 编辑器 */
.editor {
  border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px;
  min-height: 220px; background: #fff;
}
.editor:focus { outline: none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.editor.html { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }

/* 上传 */
.upload-box {
  border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px;
  text-align: center; color:#64748b; background:#f8fafc; cursor: pointer; transition:.25s;
}
.upload-box:hover { border-color:#2563eb; color:#2563eb; background:#f0f9ff; }
.file-list { margin-top: 8px; font-size: 13px; color:#334155; }
.file-list li {
  display:flex; justify-content:space-between; background:#f8fafc; padding:6px 10px;
  border-radius:6px; border:1px solid #e2e8f0; margin-bottom:4px;
}

/* 发送栏 */
.sendbar { display:flex; gap:10px; justify-content:flex-start; align-items:center; }
.btn {
  border: none; border-radius: 9999px; padding: 10px 18px; font-size: 14px;
  cursor: pointer; font-weight: 600; transition: .2s;
}
.btn.primary {
  background: linear-gradient(to right, #f97316, #ea580c); color:#fff;
  box-shadow: 0 6px 14px rgba(234,88,12,.25);
}
.btn.primary:hover { transform: translateY(-1px); }
.btn.ghost { background:#fff; color:#1e3a8a; border:1px solid #cbd5e1; }
.btn.ghost:hover { background:#f8fafc; }

/* 结果提示 */
.msg { margin-top: 8px; font-size: 14px; text-align: left; }
.msg.ok { color: #059669; }
.msg.err { color: #dc2626; }
</style>
