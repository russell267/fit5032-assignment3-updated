<template>
  <div style="max-width: 1000px; margin: 32px auto; display: grid; gap: 32px;">
    <h1>Interactive Tables (Men's health)</h1>

    <section>
      <h2>Books</h2>
      <InteractiveTable
        :endpoint="API_BASE + '/books'"
        :columns="bookCols"
        :pageSize="10"
      >
        <template #extra>
          <button @click="seedBooks" class="border px-3 py-1 rounded">Seed Books</button>
        </template>
      </InteractiveTable>
    </section>

    <section>
      <h2>Users</h2>
      <InteractiveTable
        :endpoint="API_BASE + '/users'"
        :columns="userCols"
        :pageSize="10"
      >
        <template #extra>
          <button @click="seedUsers" class="border px-3 py-1 rounded">Seed Users</button>
        </template>
      </InteractiveTable>
    </section>
  </div>
</template>

<script setup>
import InteractiveTable from '../components/InteractiveTable.vue'


const isHosting =
  location.hostname.endsWith('web.app') ||
  location.hostname.endsWith('firebaseapp.com') ||
  ((location.hostname === '127.0.0.1' || location.hostname === 'localhost') &&
    (location.port === '5005' || location.port === '5015' || location.port === '5025'))


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


async function seedBooks () {
  await fetch(`${SEED_BASE}/seedBooks`)
  alert('Books seeded!')
}
async function seedUsers () {
  await fetch(`${SEED_BASE}/seedUsers`)
  alert('Users seeded!')
}

console.log('[Interactive] isHosting:', isHosting, 'BASE:', BASE, 'API_BASE:', API_BASE)
</script>
