<template>
  <div class="space-y-3">
    <!-- top select bar -->
    <div class="flex items-center gap-2">
      <input
        v-model="q"
        @keyup.enter="onSearchNow"
        @input="scheduleSearch"
        class="border rounded px-2 py-1"
        placeholder="Global search..."
      />
      <button @click="onSearchNow" class="border px-3 py-1 rounded">Search</button>
      <button @click="onReset" class="border px-3 py-1 rounded">Reset</button>


      <slot
        name="extra"
        :rows="rows"
        :filteredRows="rows"
        :q="q"
        :filters="filters"
        :query="query"
        :page="page"
        :pageSize="pageSize"
        :fetchAll="fetchAllMatched"
      ></slot>
    </div>

    <!-- insert column -->
    <div class="grid gap-2" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
      <template v-for="c in columns" :key="c.key">
        <input
          v-if="c.searchable !== false"
          v-model="filters[c.key]"
          @keyup.enter="onSearchNow"
          @input="scheduleSearch"
          class="border rounded px-2 py-1"
          :placeholder="`Search ${c.label}`"
        />
      </template>
    </div>

    <!-- column -->
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            class="border-b text-left py-2 cursor-pointer select-none"
            @click="onSort(c.key)"
            :title="sortableTitle(c.key)"
          >
            {{ c.label }}
            <span v-if="query.sortBy === c.key">({{ query.sortDir }})</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!hasSearch && !loading">
          <td :colspan="columns.length" class="text-center text-gray-500 py-6">
            Please enter search terms above
          </td>
        </tr>

        <tr v-if="loading">
          <td :colspan="columns.length" class="text-center text-gray-500 py-6">
            Searching...
          </td>
        </tr>

        <tr v-if="hasSearch && !loading && rows.length === 0">
          <td :colspan="columns.length" class="text-center text-gray-500 py-6">
            No results
          </td>
        </tr>

        <tr v-for="row in rows" :key="row.id">
          <td v-for="c in columns" :key="c.key" class="border-b py-2">
            {{ row[c.key] }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="hasSearch && rows.length" class="flex items-center justify-between">
      <div>Page {{ page }} / {{ totalPages }}</div>
      <div class="flex gap-2">
        <button
          :disabled="page <= 1"
          @click="go(page - 1)"
          class="border px-2 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <button
          :disabled="page >= totalPages"
          @click="go(page + 1)"
          class="border px-2 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { api, debugApiBase } from '@/api'

interface Column {
  key: string
  label: string
  searchable?: boolean
}

const props = defineProps<{
  endpoint: string
  columns: Column[]
  pageSize?: number
}>()

const q = ref('')
const filters = reactive<Record<string, string>>({})
const query = reactive({
  sortBy: '',
  sortDir: 'asc' as 'asc' | 'desc',
})

const page = ref(1)
const pageSize = computed(() => props.pageSize ?? 10)
const rows = ref<any[]>([])
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const loading = ref(false)

watch(
  () => props.columns,
  (cols) => {
    cols.forEach((c) => {
      if (c.searchable !== false && filters[c.key] === undefined) {
        filters[c.key] = ''
      }
    })
  },
  { immediate: true }
)

const hasSearch = computed(() => {
  if ((q.value || '').trim()) return true
  return Object.values(filters).some((v) => (v || '').trim().length > 0)
})

function buildParams() {
  const params: Record<string, any> = {
    page: page.value,
    pageSize: pageSize.value,
  }

  if (hasSearch.value) params.requireSearch = '1'
  if (q.value.trim()) params.q = q.value.trim()

  const flt: Record<string, string> = {}
  for (const c of props.columns) {
    if (c.searchable === false) continue
    const v = (filters as any)[c.key]
    if ((v || '').trim()) flt[c.key] = String(v).trim()
  }
  if (Object.keys(flt).length) params.filters = flt

  if (query.sortBy) {
    params.sortBy = query.sortBy
    params.sortDir = query.sortDir
  }

  return params
}

let timer: ReturnType<typeof setTimeout> | null = null
function scheduleSearch() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 300)
}

function onSearchNow() {
  if (timer) clearTimeout(timer)
  page.value = 1
  fetchData()
}

function onSort(key: string) {
  if (query.sortBy === key) {
    query.sortDir = query.sortDir === 'asc' ? 'desc' : 'asc'
  } else {
    query.sortBy = key
    query.sortDir = 'asc'
  }
  fetchData()
}

function sortableTitle(key: string) {
  return query.sortBy === key ? `Sort: ${query.sortDir}` : 'Click to sort'
}

function go(p: number) {
  page.value = Math.min(Math.max(1, p), totalPages.value)
  fetchData()
}

function onReset() {
  q.value = ''
  for (const k of Object.keys(filters)) filters[k] = ''
  query.sortBy = ''
  query.sortDir = 'asc'
  rows.value = []
  total.value = 0
  page.value = 1
}

async function fetchData() {
  if (!hasSearch.value) {
    rows.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const params = buildParams()
    const { data } = await api.get(props.endpoint, { params })
    rows.value = data?.items ?? []
    total.value = data?.total ?? 0
  } catch (e) {
    console.error('[fetchData] error:', e)
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}


async function fetchAllMatched(): Promise<any[]> {
  const baseParams = buildParams()

  const size = pageSize.value || 10
  let p = 1
  let all: any[] = []

  for (let i = 0; i < 500; i++) {
    const params = { ...baseParams, page: p, pageSize: size }
    const { data } = await api.get(props.endpoint, { params })
    const chunk: any[] = Array.isArray(data) ? data : (data?.items ?? [])
    all = all.concat(chunk)
    if (!chunk.length || chunk.length < size) break
    p++
  }
  return all
}

console.log('[InteractiveTable] apiBase:', debugApiBase())
</script>
