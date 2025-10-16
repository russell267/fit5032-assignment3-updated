<template>
  <div class="table-card">

    <div class="toolbar">
      <input
        v-model="q"
        class="input"
        placeholder="Global search..."
        @input="fetchData(1)"
      />
      <slot name="extra"></slot>
    </div>


    <div class="filters">
      <div
        v-for="c in searchableColumns"
        :key="c.key"
        class="filter-item"
      >
        <label>{{ c.label }}</label>
        <input
          v-model="filters[c.key]"
          class="input"
          :placeholder="`Search ${c.label}`"
          @input="fetchData(1)"
        />
      </div>
    </div>


    <table class="table">
      <thead>
        <tr>
          <th
            v-for="c in columnsSafe"
            :key="c.key"
            class="th"
            @click="onSort(c)"
          >
            <span>{{ c.label }}</span>
            <span class="sort" v-if="sortBy === c.key">
              {{ sortDir === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in items" :key="row[idKey]">
          <td v-for="c in columnsSafe" :key="c.key">
            {{ row[c.key] }}
          </td>
        </tr>

        <tr v-if="items.length === 0">
          <td :colspan="columnsSafe.length" class="empty">No data</td>
        </tr>
      </tbody>
    </table>


    <div class="pager">
      <button :disabled="page===1" @click="fetchData(page-1)">Prev</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button :disabled="page===totalPages" @click="fetchData(page+1)">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  endpoint: { type: String, required: true },
  columns:  { type: Array,  required: true },
  idKey:    { type: String, default: 'id' },
  pageSize: { type: Number, default: 10 }
})

const items   = ref([])
const total   = ref(0)
const page    = ref(1)
const q       = ref('')
const sortBy  = ref('')
const sortDir = ref('asc')
const filters = ref({})


const columnsSafe = computed(() =>
  Array.isArray(props.columns) ? props.columns : []
)


const searchableColumns = computed(() =>
  columnsSafe.value.filter(c => c && c.searchable !== false)
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / props.pageSize))
)

function onSort(c) {
  if (sortBy.value !== c.key) {
    sortBy.value = c.key
    sortDir.value = 'asc'
  } else {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }
  fetchData(1)
}

async function fetchData(toPage = page.value) {
  page.value = toPage

  const params = new URLSearchParams({
    page:     String(page.value),
    pageSize: String(props.pageSize),
    q:        q.value,
    sortBy:   sortBy.value,
    sortDir:  sortDir.value
  })
  for (const [k, v] of Object.entries(filters.value)) {
    if (v) params.append(`filters[${k}]`, v)
  }

  const res  = await fetch(`${props.endpoint}?${params.toString()}`)
  const data = await res.json()
  items.value = Array.isArray(data.items) ? data.items : []
  total.value = Number.isFinite(data.total) ? data.total : 0
}

onMounted(() => {

  columnsSafe.value.forEach(c => (filters.value[c.key] = ''))
  fetchData(1)
})


watch(() => props.endpoint, () => fetchData(1))
watch(() => props.columns,  () => {

  const newFilters = {}
  columnsSafe.value.forEach(c => { newFilters[c.key] = filters.value[c.key] || '' })
  filters.value = newFilters
  fetchData(1)
})
</script>

<style scoped>
.table-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.toolbar { display: flex; gap: 12px; margin-bottom: 8px; }
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 8px; margin: 8px 0 12px; }
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.input { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; outline: none; }
.table { width: 100%; border-collapse: collapse; }
.th { user-select:none; cursor: pointer; text-align: left; border-bottom: 1px solid #e5e7eb; padding: 10px; }
td { border-bottom: 1px solid #f3f4f6; padding: 10px; }
.sort { margin-left: 6px; font-size: 12px; opacity: .7; }
.empty { text-align:center; color:#6b7280; padding: 20px; }
.pager { display:flex; gap: 12px; align-items:center; justify-content:flex-end; padding-top: 10px; }
button { border:1px solid #d1d5db; background:#fff; padding:6px 10px; border-radius:8px; cursor:pointer; }
button:disabled { opacity:.5; cursor:not-allowed; }
</style>
