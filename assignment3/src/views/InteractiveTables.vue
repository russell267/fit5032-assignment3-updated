<template>
  <div class="container">
    <header class="header">
      <h1>Men s Health Dashboard</h1>
      <p class="subtitle">Explore, manage and communicate your library & user data effectively.</p>
    </header>

    <!-- Books Section -->
    <section class="card">
      <h2><i class="fas fa-book"></i> Books Library</h2>

      <InteractiveTable
        :endpoint="API_BASE + '/books'"
        :columns="bookCols"
        :pageSize="10"
      >
        <template #extra="t">
          <div class="toolbar">
            <button @click="seedBooks" class="btn primary">Seed Books</button>
            <div class="spacer"></div>

            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'csv')">Export CSV</button>
            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'pdf')">Export PDF</button>
            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'json')">Export JSON</button>

            <button class="btn ghost" @click="exportAll(API_BASE + '/books', bookCols, 'books', 'csv')">All CSV</button>
            <button class="btn ghost" @click="exportAll(API_BASE + '/books', bookCols, 'books', 'pdf')">All PDF</button>
          </div>
        </template>
      </InteractiveTable>
    </section>

    <!-- Users Section -->
    <section class="card">
      <h2><i class="fas fa-users"></i> Users Directory</h2>

      <InteractiveTable
        :endpoint="API_BASE + '/users'"
        :columns="userCols"
        :pageSize="10"
      >
        <template #extra="t">
          <div class="toolbar">
            <button @click="seedUsers" class="btn primary">Seed Users</button>
            <div class="spacer"></div>

            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'csv')">Export CSV</button>
            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'pdf')">Export PDF</button>
            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'json')">Export JSON</button>

            <button class="btn ghost" @click="exportAll(API_BASE + '/users', userCols, 'users', 'csv')">All CSV</button>
            <button class="btn ghost" @click="exportAll(API_BASE + '/users', userCols, 'users', 'pdf')">All PDF</button>

            <div class="spacer"></div>

            <button class="btn accent" @click="bulkEmailCurrent(t)">Send Email</button>
            <button class="btn ghost accent" @click="bulkEmailAll(t)">Send All (fetchAll)</button>
          </div>
        </template>
      </InteractiveTable>
    </section>
  </div>
</template>

<script setup>
import InteractiveTable from '@/components/InteractiveTable.vue'
import { exportToCSV, exportToPDF, exportToJSON } from '@/utils/export'


const isHosting =
  location.hostname.endsWith('web.app') ||
  location.hostname.endsWith('firebaseapp.com') ||
  ((location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    ['5005', '5015', '5025'].includes(location.port))

const DEFAULT_FN_BASE = 'http://127.0.0.1:5007/week8-jiaquan/us-central1'
const ENV_BASE = (import.meta.env.VITE_FUNCTIONS_URL || '').replace(/\/$/, '')
const BASE = isHosting ? '' : (ENV_BASE || DEFAULT_FN_BASE)
const API_BASE = BASE + '/api'
const SEED_BASE = BASE

const bookCols = [
  { key: 'id', label: 'ID', searchable: false },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'year', label: 'Year' },
  { key: 'pages', label: 'Pages' },
]

const userCols = [
  { key: 'id', label: 'ID', searchable: false },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
]


function toExportColumns(cols) {
  return cols.map(c => ({ header: c.label, field: c.key }))
}
function exportCurrent(t, cols, baseName, kind = 'csv') {
  const maybe = (t && (t.filteredRows || t.rows || t.data || t.items)) || null
  const arr = Array.isArray(maybe) ? maybe : null
  if (!arr || !arr.length) return alert('nowhere to export!')
  const expCols = toExportColumns(cols)
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filenameBase = `${baseName}_filtered_${ts}`
  if (kind === 'csv') exportToCSV(arr, expCols, `${filenameBase}.csv`)
  else if (kind === 'pdf') exportToPDF(arr, expCols, `${filenameBase}.pdf`, `${baseName} (filtered)`)
  else exportToJSON(arr, expCols, `${filenameBase}.json`)
}
async function fetchAll(endpoint) {
  const pageSize = 100
  let page = 1
  let all = []
  for (let i = 0; i < 200; i++) {
    const url = `${endpoint}?page=${page}&pageSize=${pageSize}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    const json = await res.json()
    const chunk = Array.isArray(json) ? json : (json.data || json.items || json.rows || [])
    all = all.concat(chunk)
    if (!chunk.length || chunk.length < pageSize) break
    page++
  }
  return all
}
async function exportAll(endpoint, cols, baseName, kind = 'csv') {
  try {
    const data = await fetchAll(endpoint)
    const expCols = toExportColumns(cols)
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const filenameBase = `${baseName}_all_${ts}`
    if (kind === 'csv') exportToCSV(data, expCols, `${filenameBase}.csv`)
    else if (kind === 'pdf') exportToPDF(data, expCols, `${filenameBase}.pdf`, `${baseName} (all)`)
    else exportToJSON(data, expCols, `${filenameBase}.json`)
  } catch (e) {
    console.error(e)
    alert('Export all failed')
  }
}
async function seedBooks() { try { await fetch(`${SEED_BASE}/seedBooks`); alert('Books seeded!') } catch (e) { alert('Seed books failed'); console.error(e) } }
async function seedUsers() { try { await fetch(`${SEED_BASE}/seedUsers`); alert('Users seeded!') } catch (e) { alert('Seed users failed'); console.error(e) } }
async function callSendBulkEmail(recipients, subject, body) {
  if (!recipients?.length) return alert('sender is empty')
  try {
    const resp = await fetch(`${SEED_BASE}/sendBulkEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: recipients, subject, text: body })
    })
    if (!resp.ok) throw new Error(await resp.text())
    const res = await resp.json().catch(() => ({}))
    alert(`send successful ${res.sent ?? recipients.length} emails`)
  } catch (e) {
    console.error(e)
    alert('send failed: ' + e.message)
  }
}
function askEmailContent() {
  const subject = prompt('please input the theme', 'Notice from Men s Health Dashboard')
  if (!subject) return null
  const text = prompt('please input the context', 'Stay healthy and active!')
  if (!text) return null
  return { subject, text }
}
async function bulkEmailCurrent(t) {
  const arr = Array.isArray(t?.rows) ? t.rows : []
  if (!arr.length) return alert('no previous data to send email')
  const emails = arr.map(u => u.email).filter(Boolean)
  const conf = askEmailContent()
  if (!conf) return
  await callSendBulkEmail(emails, conf.subject, conf.text)
}
async function bulkEmailAll(t) {
  if (typeof t?.fetchAll !== 'function') return alert('not possible to fetch all from this table')
  const all = await t.fetchAll()
  if (!all?.length) return alert('no matching data to send email')
  const emails = [...new Set(all.map(u => u.email).filter(Boolean))]
  const conf = askEmailContent()
  if (!conf) return
  const batchSize = 200
  for (let i = 0; i < emails.length; i += batchSize) {
    const slice = emails.slice(i, i + batchSize)
    await callSendBulkEmail(slice, conf.subject, conf.text)
  }
}
</script>

<style scoped>

.container {
  max-width: 1000px;
  margin: 32px auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
}


.header {
  text-align: center;
  background: linear-gradient(135deg, #1e3a8a, #0f172a);
  color: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.header h1 {
  font-size: 30px;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 15px;
  opacity: 0.85;
}


.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}
.card:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}
.card h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}


.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}
.spacer { flex: 1; }


.btn {
  border: 1px solid #e5e7eb;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  background: #fff;
  transition: all 0.2s ease;
  font-size: 14px;
}
.btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}
.btn.primary {
  background: #1e3a8a;
  color: #fff;
  border: none;
}
.btn.primary:hover {
  background: #334155;
}
.btn.accent {
  background: #ea580c;
  color: white;
  border: none;
}
.btn.accent:hover {
  background: #fb923c;
}
.btn.ghost {
  opacity: 0.9;
  border-style: dashed;
}
</style>
