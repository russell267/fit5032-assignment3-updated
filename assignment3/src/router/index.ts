import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/HomeView.vue') },
  { path: '/interactive', name: 'Interactive', component: () => import('@/views/InteractiveTables.vue') },
  { path: '/map', name: 'Map', component: () => import('@/views/MapView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
