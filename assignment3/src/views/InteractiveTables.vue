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
          <button @click="seedBooks">Search</button>
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
          <button @click="seedUsers">Search</button>
        </template>
      </InteractiveTable>
    </section>
  </div>
</template>

<script setup>
import InteractiveTable from '../components/InteractiveTable.vue'


const API_BASE = 'http://127.0.0.1:5001/week8-jiaquan/us-central1/api'
const SEED_BASE = 'http://127.0.0.1:5001/week8-jiaquan/us-central1'

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
  alert('Courses Successfully added!')
}
async function seedUsers () {
  await fetch(`${SEED_BASE}/seedUsers`)
  alert('Users seeded!')
}
</script>
