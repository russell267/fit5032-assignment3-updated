<template>
  <div class="container">
    <h1>Interactive Tables (Men's health)</h1>

    <!-- Books -->
    <section>
      <h2>Books</h2>

      <InteractiveTable
        :endpoint="API_BASE + '/books'"
        :columns="bookCols"
        :pageSize="10"
      >

        <template #extra="t">
          <div class="toolbar">
            <button @click="seedBooks" class="btn">Seed Books</button>
            <div class="spacer"></div>


            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'csv')">export csv</button>
            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'pdf')">export PDF</button>
            <button class="btn" @click="exportCurrent(t, bookCols, 'books', 'json')">export JSON</button>


            <button class="btn ghost" @click="exportAll(API_BASE + '/books', bookCols, 'books', 'csv')">export CSV</button>
            <button class="btn ghost" @click="exportAll(API_BASE + '/books', bookCols, 'books', 'pdf')">export PDF</button>
          </div>
        </template>
      </InteractiveTable>
    </section>

    <!-- Users -->
    <section>
      <h2>Users</h2>

      <InteractiveTable
        :endpoint="API_BASE + '/users'"
        :columns="userCols"
        :pageSize="10"
      >
        <template #extra="t">
          <div class="toolbar">
            <button @click="seedUsers" class="btn">Seed Users</button>
            <div class="spacer"></div>


            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'csv')">export CSV</button>
            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'pdf')">export PDF</button>
            <button class="btn" @click="exportCurrent(t, userCols, 'users', 'json')">export JSON</button>


            <button class="btn ghost" @click="exportAll(API_BASE + '/users', userCols, 'users', 'csv')">export CSV</button>
            <button class="btn ghost" @click="exportAll(API_BASE + '/users', userCols, 'users', 'pdf')">export PDF</button>
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
  (
    (location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    ['5005', '5015', '5025'].includes(location.port)
  )

const DEFAULT_FN_BASE = 'http://127.0.0.1:5007/week8-jiaquan/us-central1'
const ENV_BASE = (import.meta.env.VITE_FUNCTIONS_URL || '').replace(/\/$/, '')
const BASE = isHosting ? '' : (ENV_BASE || DEFAULT_FN_BASE)

const API_BASE = BASE + '/api'
const SEED_BASE = BASE


const bookCols = [
  { key: 'id',    label: 'ID',    searchable: false },
  { key: 'title', label: 'Title' },
  { key: 'author',label: 'Author' },
  { key: 'year',  label: 'Year' },
  { key: 'pages', label: 'Pages' },
]

const userCols = [
  { key: 'id',    label: 'ID',    searchable: false },
  { key: 'name',  label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role',  label: 'Role' },
]


function toExportColumns(cols) {
  return cols.map(c => ({ header: c.label, field: c.key }))
}


function getDeepValue(obj, path) {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)
}


function exportCurrent(t, cols, baseName, kind = 'csv') {
  const maybe =
    (t && (t.filteredRows || t.filtered || t.rows || t.data || t.items)) || null

  const arr = Array.isArray(maybe) ? maybe : null
  if (!arr || !arr.length) {
    alert('nowhere to export!')
    return
  }

  const expCols = toExportColumns(cols)
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filenameBase = `${baseName}_filtered_${ts}`

  if (kind === 'csv') {
    exportToCSV(arr, expCols, `${filenameBase}.csv`)
  } else if (kind === 'pdf') {
    exportToPDF(arr, expCols, `${filenameBase}.pdf`, `${baseName} (now filtered)`)
  } else {
    exportToJSON(arr, expCols, `${filenameBase}.json`)
  }
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


    const chunk = Array.isArray(json)
      ? json
      : (json.data || json.items || json.rows || [])

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

    if (kind === 'csv') {
      exportToCSV(data, expCols, `${filenameBase}.csv`)
    } else if (kind === 'pdf') {
      exportToPDF(data, expCols, `${filenameBase}.pdf`, `${baseName} (all)`)
    } else {
      exportToJSON(data, expCols, `${filenameBase}.json`)
    }
  } catch (e) {
    console.error(e)
    alert('Export all failed')
  }
}


async function seedBooks () {
  try {
    await fetch(`${SEED_BASE}/seedBooks`)
    alert('Books seeded!')
  } catch (e) {
    alert('Seed books failed')
    console.error(e)
  }
}
async function seedUsers () {
  try {
    await fetch(`${SEED_BASE}/seedUsers`)
    alert('Users seeded!')
  } catch (e) {
    alert('Seed users failed')
    console.error(e)
  }
}

console.log('[Interactive] isHosting:', isHosting, 'BASE:', BASE, 'API_BASE:', API_BASE)
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 32px auto;
  display: grid;
  gap: 32px;
}
h1 {
  font-size: 24px;
  font-weight: 700;
}
h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.spacer { flex: 1; }
.btn {
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
}
.btn:hover { background: #f3f4f6; }
.btn.ghost { opacity: .85; }
</style>
