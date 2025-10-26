<template>
  <div class="page">

    <div class="hero">
      <h1>Men s Health · Interactive Charts</h1>
      <p>Visualise your books & users data at a glance.</p>
    </div>

    <div class="container">
      <!-- Books by Year -->
      <section class="card">
        <div class="card-head">
          <h2>Books by Year</h2>
          <button class="btn pill ghost" @click="reload">Reload</button>
        </div>
        <canvas ref="booksYearRef" height="120"></canvas>
      </section>

      <!-- Users by Role -->
      <section class="card">
        <div class="card-head">
          <h2>Users by Role</h2>
        </div>
        <canvas ref="usersRoleRef" height="120"></canvas>
      </section>

      <!-- Avg Pages by Year -->
      <section class="card">
        <div class="card-head">
          <h2>Average Pages by Year</h2>
        </div>
        <canvas ref="avgPagesRef" height="120"></canvas>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PieController, ArcElement, LineController, LineElement, PointElement, Filler, TimeScale } from 'chart.js'


Chart.register(
  BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
  PieController, ArcElement,
  LineController, LineElement, PointElement, Filler, TimeScale
)


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

// refs & chart instances
const booksYearRef = ref<HTMLCanvasElement | null>(null)
const usersRoleRef = ref<HTMLCanvasElement | null>(null)
const avgPagesRef = ref<HTMLCanvasElement | null>(null)

let booksYearChart: Chart | null = null
let usersRoleChart: Chart | null = null
let avgPagesChart: Chart | null = null


async function fetchAll(endpoint: string) {
  const ps = 500
  let page = 1
  const all: any[] = []
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${endpoint}?page=${page}&pageSize=${ps}`)
    const j = await res.json()
    const chunk = Array.isArray(j) ? j : (j.items || j.data || j.rows || [])
    all.push(...chunk)
    if (!chunk.length || chunk.length < ps) break
    page++
  }
  return all
}

function groupCountBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = String(r[key] ?? 'Unknown')
    m.set(k, (m.get(k) || 0) + 1)
  }
  const labels = Array.from(m.keys()).sort((a, b) => a.localeCompare(b))
  const data = labels.map(l => m.get(l) || 0)
  return { labels, data }
}

function avgBy(rows: any[], groupKey: string, valueKey: string) {
  const sum = new Map<string, number>()
  const cnt = new Map<string, number>()
  for (const r of rows) {
    const k = String(r[groupKey] ?? 'Unknown')
    const v = Number(r[valueKey] ?? 0)
    sum.set(k, (sum.get(k) || 0) + (isFinite(v) ? v : 0))
    cnt.set(k, (cnt.get(k) || 0) + 1)
  }
  const labels = Array.from(sum.keys()).sort((a, b) => Number(a) - Number(b))
  const data = labels.map(l => {
    const c = cnt.get(l) || 1
    return +( (sum.get(l) || 0) / c ).toFixed(2)
  })
  return { labels, data }
}

function mkGradient(ctx: CanvasRenderingContext2D, from: string, to: string) {
  const g = ctx.createLinearGradient(0, 0, 0, 300)
  g.addColorStop(0, from)
  g.addColorStop(1, to)
  return g
}

async function renderCharts() {
  const books = await fetchAll(`${API_BASE}/books`)
  const users = await fetchAll(`${API_BASE}/users`)

  // 1) Books by year - bar
  if (booksYearRef.value) {
    const ctx = booksYearRef.value.getContext('2d')!
    const byYear = groupCountBy(books, 'year' as any)
    booksYearChart?.destroy()
    booksYearChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: byYear.labels,
        datasets: [{
          label: 'Books',
          data: byYear.data,
          backgroundColor: mkGradient(ctx, '#3b82f6', '#1e3a8a'),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
      }
    })
  }

  // 2) Users role pie
  if (usersRoleRef.value) {
    const ctx = usersRoleRef.value.getContext('2d')!
    const byRole = groupCountBy(users, 'role' as any)
    usersRoleChart?.destroy()
    usersRoleChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: byRole.labels,
        datasets: [{
          data: byRole.data,
          backgroundColor: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#6366f1']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    })
  }

  // 3) Average pages by year - line
  if (avgPagesRef.value) {
    const ctx = avgPagesRef.value.getContext('2d')!
    const avg = avgBy(books, 'year', 'pages')
    avgPagesChart?.destroy()
    avgPagesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: avg.labels,
        datasets: [{
          label: 'Avg Pages',
          data: avg.data,
          fill: true,
          backgroundColor: 'rgba(14,165,233,0.12)',
          borderColor: '#0ea5e9',
          tension: 0.35,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
      }
    })
  }
}

function cleanup() {
  booksYearChart?.destroy(); booksYearChart = null
  usersRoleChart?.destroy(); usersRoleChart = null
  avgPagesChart?.destroy(); avgPagesChart = null
}

async function reload() {
  cleanup()
  await renderCharts()
}

onMounted(renderCharts)
onBeforeUnmount(cleanup)
</script>

<style scoped>

.page { min-height: 100vh; padding: 28px 16px 60px; background: #f8fafc; }
.hero {
  max-width: 1000px; margin: 0 auto 20px; padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #111827 100%);
  color: #fff; text-align: center;
  box-shadow: 0 12px 28px rgba(30,58,138,.25);
}
.hero h1 { font-size: 24px; font-weight: 700; margin: 0 0 6px; }
.hero p { margin: 0; opacity: .9; font-size: 14px; }

.container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(2,6,23,.06);
  padding: 14px;
}
.card-head {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #eef2f7; padding: 6px 4px 8px; margin: -6px -4px 10px;
}
.card-head h2 { font-weight: 700; color: #1e3a8a; font-size: 15px; }

.btn { border: 1px solid #e5e7eb; background: #fff; padding: 7px 14px;
  border-radius: 8px; font-size: 13px; cursor: pointer; transition: .18s; }
.btn:hover { background: #f8fafc; transform: translateY(-1px); }
.btn.pill { border-radius: 9999px; }
.btn.ghost { border-style: dashed; }
</style>
