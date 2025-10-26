<template>
  <div class="page">

    <div class="hero">
      <h1>Men s Health · Find & Navigate</h1>
      <p>Search gyms, clinics, and parks. Plan a healthy route with one click.</p>
    </div>


    <div class="max-w-[1000px] mx-auto mb-4 flex items-center justify-between text-[13px] text-slate-600">
      <div class="inline-flex items-center gap-2">
        <span class="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
          <span class="text-slate-400">Start</span>
          <span v-if="from" class="font-mono text-slate-800">{{ from![0].toFixed(4) }}, {{ from![1].toFixed(4) }}</span>
          <span v-else class="italic text-slate-400">No start location</span>
        </span>

        <button
          v-if="from"
          class="btn pill ghost"
          @click="recenter"
          title="Re-center map"
        >
          Re-center
        </button>
      </div>

      <button
        v-if="results.length || summary || to"
        @click="resetAll"
        class="btn pill ghost"
        title="Clear results & route"
      >
        Reset
      </button>
    </div>


    <div class="card max-w-[1000px] mx-auto mb-5">
      <div class="toolbar">
        <div class="relative w-full sm:w-96">
          <input
            v-model="keyword"
            @keyup.enter="onSearch"
            class="input w-full pr-10"
            placeholder="Search places (e.g., gym, clinic, park)"
          />
          <button
            v-if="keyword"
            class="abs-clear"
            @click="clearSearch"
            title="Clear"
          >
            x
          </button>
        </div>

        <button
          @click="onSearch"
          class="btn pill primary"
          :disabled="loading"
        >
          <span v-if="!loading">Search</span>
          <span v-else>Searching...</span>
        </button>

        <div class="spacer"></div>

        <button
          @click="useMyLocation"
          class="btn pill"
          title="Use my current location as start point"
        >
          Use my location
        </button>
      </div>
    </div>


    <div class="container">

      <section class="card p-0 overflow-hidden">
        <div id="map" class="map-frame"></div>
      </section>


      <aside class="side space-y-4">

        <div class="card">
          <div class="card-head">
            <h2>Results</h2>
            <span class="chip" v-if="results.length">{{ results.length }}</span>
          </div>

          <div class="max-h-72 overflow-auto">
            <template v-if="results.length">
              <button
                v-for="p in results"
                :key="p.id"
                class="result-row"
                :class="isSelected(p) ? 'row-active' : ''"
                @click="selectPlace(p)"
              >
                <div class="dot" :class="isSelected(p) ? 'dot-active' : ''"></div>
                <div class="min-w-0">
                  <div class="truncate font-medium text-slate-800">{{ p.name }}</div>
                  <div class="truncate text-[12px] text-slate-500">{{ p.full }}</div>
                </div>
              </button>
            </template>

            <div v-else class="empty">
              <div v-if="loading">Searching nearby places...</div>
              <div v-else>Try searching for <b>gym</b>, <b>clinic</b> or <b>park</b>.</div>
            </div>
          </div>
        </div>


        <div v-if="summary" class="card">
          <div class="card-head"><h2>Trip</h2></div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="stat">
                <div class="stat-label">Distance</div>
                <div class="stat-value">{{ (summary.distance / 1000).toFixed(2) }} km</div>
              </div>
              <div class="stat">
                <div class="stat-label">Duration</div>
                <div class="stat-value">~{{ Math.round(summary.duration / 60) }} min</div>
              </div>
            </div>


            <div class="seg">
              <button
                v-for="m in ['walking','driving','cycling']"
                :key="m"
                class="seg-btn"
                :class="profile === m ? 'seg-active' : ''"
                @click="route(m as any)"
              >
                {{ capitalize(m) }}
              </button>
            </div>

            <button class="btn pill ghost w-full" @click="savePlace">Save place</button>
          </div>
        </div>


        <div v-if="steps.length" class="card">
          <div class="card-head"><h2>Steps</h2></div>
          <ol class="steps">
            <li v-for="(s, i) in steps" :key="i">
              {{ s.maneuver?.instruction || (s.maneuver?.type + ' ' + (s.name || '')) }}
              — {{ Math.round(s.distance) }} m
            </li>
          </ol>
        </div>
      </aside>
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

.page { min-height: 100vh; padding: 28px 16px 60px; background: #f8fafc; }
.container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
}


.hero {
  max-width: 1000px; margin: 0 auto 18px;
  padding: 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #111827 100%);
  color: #fff; text-align: center;
  box-shadow: 0 12px 28px rgba(30,58,138,.25);
}
.hero h1 { font-size: 24px; font-weight: 700; margin: 0 0 6px; letter-spacing: .2px; }
.hero p { margin: 0; opacity: .9; font-size: 14px; }


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
.chip { font-size: 12px; color: #334155; background: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 9999px; }


.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.input {
  border: 1px solid #e5e7eb; border-radius: 9999px; padding: 8px 12px;
  outline: none; font-size: 14px; transition: .2s;
}
.input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.abs-clear {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  color: #94a3b8;
}
.spacer { flex: 1; }


.btn {
  border: 1px solid #e5e7eb; background: #fff;
  padding: 7px 14px; border-radius: 9999px; font-size: 13px; cursor: pointer;
  transition: all .18s ease;
}
.btn:hover { background: #f8fafc; transform: translateY(-1px); }
.btn.primary { background: #1f3a8a; color: #fff; border-color: #1f3a8a; box-shadow: 0 6px 14px rgba(31,58,138,.18); }
.btn.primary:hover { background: #2a50b1; }
.btn.ghost { background: #fff; border-style: dashed; }
.btn:disabled { opacity: .6; cursor: not-allowed; }


.result-row {
  display: flex; gap: 8px; width: 100%; text-align: left;
  padding: 8px 10px; border-radius: 10px;
}
.result-row:hover { background: #f8fafc; }
.row-active { background: rgba(37,99,235,.08); }
.dot { width: 6px; height: 6px; border-radius: 9999px; background: #cbd5e1; margin-top: 6px; }
.dot-active { background: #2563eb; }
.empty { padding: 28px 10px; text-align: center; color: #64748b; font-size: 13px; }


.stat { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 8px 10px; }
.stat-label { color: #64748b; font-size: 12px; }
.stat-value { font-weight: 700; color: #0f172a; }


.seg { display: flex; overflow: hidden; border: 1px solid #e5e7eb; border-radius: 10px; }
.seg-btn { flex: 1; padding: 7px 10px; font-size: 13px; background: #fff; }
.seg-btn:hover { background: #f8fafc; }
.seg-active { background: #2563eb; color: #fff; }


.steps { max-height: 280px; overflow: auto; padding: 8px 12px; font-size: 13px; list-style: decimal; }


.map-frame { height: 560px; width: 100%; border-radius: 14px; border: 1px solid #eef2f7; }


@media (max-width: 900px) {
  .container { grid-template-columns: 1fr; }
  .side { order: 2; }
}
</style>
