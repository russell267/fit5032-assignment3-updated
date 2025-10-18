<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight">Find and Navigate</h1>

      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span v-if="from">
          From:
          <span class="font-mono">{{ from![0].toFixed(4) }}, {{ from![1].toFixed(4) }}</span>
        </span>
        <span v-else class="italic">No start location</span>

        <button
          v-if="from"
          class="ml-2 rounded border px-2 py-1 hover:bg-gray-50"
          @click="recenter"
          title="Re-center map"
        >
          Re-center
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-wrap items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 shadow-sm"
    >
      <div class="relative">
        <input
          v-model="keyword"
          @keyup.enter="onSearch"
          class="w-80 rounded-lg border px-3 py-2 pr-9 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search places (e.g., gym, clinic, park)"
        />
        <button
          v-if="keyword"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          @click="clearSearch"
          title="Clear"
        >
          ✕
        </button>
      </div>

      <button
        @click="onSearch"
        class="rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
      >
        <span v-if="!loading">Search</span>
        <span v-else>Searching...</span>
      </button>

      <div class="mx-2 h-6 w-px bg-gray-200"></div>

      <button
        @click="useMyLocation"
        class="rounded-lg border px-3 py-2 hover:bg-gray-50"
        title="Use my current location as start point"
      >
        Use my location
      </button>

      <button
        v-if="results.length || summary || to"
        @click="resetAll"
        class="ml-auto rounded-lg border px-3 py-2 text-gray-600 hover:bg-gray-50"
        title="Clear results & route"
      >
        Reset
      </button>
    </div>

    <!-- Main -->
    <div class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <!-- Map -->
      <div id="map" class="h-[560px] w-full rounded-xl border shadow-sm"></div>

      <!-- Side panel -->
      <div class="space-y-4">
        <!-- Results -->
        <div class="rounded-xl border bg-white/70 shadow-sm">
          <div class="flex items-center justify-between border-b px-3 py-2">
            <h2 class="font-semibold">Results</h2>
            <span class="text-xs text-gray-500" v-if="results.length">{{ results.length }}</span>
          </div>

          <div class="max-h-72 overflow-auto">
            <template v-if="results.length">
              <button
                v-for="p in results"
                :key="p.id"
                class="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                :class="isSelected(p) ? 'bg-blue-50/60' : ''"
                @click="selectPlace(p)"
              >
                <div class="mt-1 h-2 w-2 rounded-full" :class="isSelected(p) ? 'bg-blue-500' : 'bg-gray-300'"></div>
                <div class="min-w-0">
                  <div class="truncate font-medium">{{ p.name }}</div>
                  <div class="truncate text-sm text-gray-500">{{ p.full }}</div>
                </div>
              </button>
            </template>

            <div v-else class="px-3 py-8 text-center text-sm text-gray-500">
              <div v-if="loading">Searching nearby places...</div>
              <div v-else>Try searching for <span class="font-medium">gym</span>, <span class="font-medium">clinic</span>, or <span class="font-medium">park</span>.</div>
            </div>
          </div>
        </div>

        <!-- Trip summary -->
        <div v-if="summary" class="rounded-xl border bg-white/70 shadow-sm">
          <div class="border-b px-3 py-2">
            <h2 class="font-semibold">Trip</h2>
          </div>

          <div class="space-y-3 p-3">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-lg bg-gray-50 px-3 py-2">
                <div class="text-gray-500">Distance</div>
                <div class="font-semibold">{{ (summary.distance / 1000).toFixed(2) }} km</div>
              </div>
              <div class="rounded-lg bg-gray-50 px-3 py-2">
                <div class="text-gray-500">Duration</div>
                <div class="font-semibold">~{{ Math.round(summary.duration / 60) }} min</div>
              </div>
            </div>

            <!-- Profile segmented control -->
            <div class="flex overflow-hidden rounded-lg border text-sm">
              <button
                v-for="m in ['walking','driving','cycling']"
                :key="m"
                class="flex-1 px-3 py-1.5"
                :class="profile === m ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'"
                @click="route(m as any)"
              >
                {{ capitalize(m) }}
              </button>
            </div>

            <button
              @click="savePlace"
              class="w-full rounded-lg border px-3 py-2 hover:bg-gray-50"
            >
              Save place
            </button>
          </div>
        </div>

        <!-- Steps -->
        <div v-if="steps.length" class="rounded-xl border bg-white/70 shadow-sm">
          <div class="border-b px-3 py-2">
            <h2 class="font-semibold">Steps</h2>
          </div>
          <ol class="max-h-72 list-decimal space-y-1 overflow-auto px-6 py-3 text-sm">
            <li v-for="(s, i) in steps" :key="i">
              {{ s.maneuver?.instruction || (s.maneuver?.type + ' ' + (s.name || '')) }}
              — {{ Math.round(s.distance) }} m
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getGeocode, getRoute } from '@/api'

let map: maplibregl.Map
let fromMarker: maplibregl.Marker | null = null
let toMarker: maplibregl.Marker | null = null
const ROUTE_LAYER_ID = 'route-line'
const ROUTE_SOURCE_ID = 'route-source'

const keyword = ref('')
const results = ref<any[]>([])
const from = ref<[number, number] | null>(null)
const to = ref<[number, number] | null>(null)
const locLabel = ref('')
const steps = ref<any[]>([])
const summary = ref<{ distance: number; duration: number } | null>(null)
const loading = ref(false)
const profile = ref<'walking' | 'driving' | 'cycling'>('walking')

const auth = getAuth()
const db = getFirestore()
let uid: string | null = null
onAuthStateChanged(auth, (u) => { uid = u?.uid || null })

onMounted(() => {
  const style = {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm-tiles' }]
  }

  map = new maplibregl.Map({
    container: 'map',
    style,
    center: [144.9631, -37.8136],
    zoom: 12
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')
})

onBeforeUnmount(() => {
  try { map?.remove() } catch {}
})

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

function recenter() {
  if (from.value) map.flyTo({ center: from.value, zoom: 14 })
}

function clearSearch() {
  keyword.value = ''
  results.value = []
}

function resetAll() {
  results.value = []
  steps.value = []
  summary.value = null
  to.value = null
  if (toMarker) { toMarker.remove(); toMarker = null }
  if (map.getSource(ROUTE_SOURCE_ID)) {

    ;(map.getSource(ROUTE_SOURCE_ID) as any).setData({ type: 'FeatureCollection', features: [] })
  }
}

function isSelected(p: any) {
  return to.value && p.center && p.center[0] === to.value[0] && p.center[1] === to.value[1]
}

function useMyLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lng = pos.coords.longitude
      const lat = pos.coords.latitude
      from.value = [lng, lat]
      locLabel.value = `${lng.toFixed(4)}, ${lat.toFixed(4)}`
      if (fromMarker) fromMarker.remove()
      fromMarker = new maplibregl.Marker({ color: '#0ea5e9' }).setLngLat(from.value).addTo(map)
      map.flyTo({ center: from.value, zoom: 14 })
      if (to.value) route(profile.value)
    },
    (err) => alert('Location failed: ' + err.message),
    { enableHighAccuracy: true }
  )
}

async function onSearch() {
  const q = keyword.value.trim()
  if (!q) { results.value = []; return }
  loading.value = true
  try {
    const params: any = { q, limit: 8 }
    if (from.value) params.proximity = `${from.value[0]},${from.value[1]}`
    const data = await getGeocode(params)
    results.value = data?.items || []
  } catch (e: any) {
    alert('Search failed: ' + (e?.message || e))
  } finally {
    loading.value = false
  }
}

function selectPlace(p: any) {
  to.value = p.center as [number, number]
  if (toMarker) toMarker.remove()
  toMarker = new maplibregl.Marker({ color: '#ef4444' }).setLngLat(to.value!).addTo(map)
  if (from.value) {
    route(profile.value)
  } else {
    map.flyTo({ center: to.value!, zoom: 14 })
  }
}

async function route(m: 'walking' | 'driving' | 'cycling') {
  if (!from.value || !to.value) return
  profile.value = m
  try {
    const data = await getRoute({
      from: `${from.value[0]},${from.value[1]}`,
      to: `${to.value[0]},${to.value[1]}`,
      profile: m
    })

    if (!data?.ok) return
    steps.value = data.steps || []
    summary.value = { distance: data.distance, duration: data.duration }

    const geo = { type: 'Feature', geometry: data.geometry, properties: {} }


    if (map.getSource(ROUTE_SOURCE_ID)) {
      (map.getSource(ROUTE_SOURCE_ID) as any).setData(geo)
    } else {
      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geo as any })
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        paint: { 'line-color': '#2563eb', 'line-width': 4 }
      })
    }

    const coords: [number, number][] = data.geometry.coordinates
    const bounds = coords.reduce(
      (bb: any, c: any) => bb.extend(c),
      new maplibregl.LngLatBounds(coords[0], coords[0])
    )
    map.fitBounds(bounds, { padding: 48 })
  } catch (e: any) {
    alert('Route failed: ' + (e?.message || e))
  }
}

async function savePlace() {
  if (!uid || !to.value) return alert('Please sign in first')
  const name =
    results.value.find(r => r.center?.[0] === to.value![0] && r.center?.[1] === to.value![1])?.name || 'Place'
  await addDoc(collection(db, 'saved_places'), {
    uid,
    name,
    lng: to.value[0],
    lat: to.value[1],
    createdAt: serverTimestamp()
  })
  alert('Saved!')
}
</script>

<style scoped>
#map { min-height: 560px; }
</style>
