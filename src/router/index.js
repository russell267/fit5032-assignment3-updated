import { createRouter, createWebHistory } from 'vue-router'

// ===== Views =====
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import FirebaseSigninView from '@/views/FirebaseSigninView.vue'
import FirebaseRegisterView from '@/views/FirebaseRegisterView.vue'
import AddBookView from '@/views/AddBookView.vue'
import GetBookCountView from '@/views/GetBookCountView.vue'
import WeatherView from '../views/WeatherView.vue'
import CountBookAPI from '../views/CountBookAPI.vue'
import SendEmailView from '@/views/SendEmailView.vue'
import InteractiveTables from '../views/InteractiveTables.vue'
import InteractiveChartsView from '@/views/InteractiveChartsView.vue'
import MapView1 from '@/views/MapView1.vue'

const routes = [
  // === Core Pages ===
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },

  // === Firebase Auth ===
  {
    path: '/firelogin',
    name: 'FireLogin',
    component: FirebaseSigninView,
  },
  {
    path: '/fireregister',
    name: 'FireRegister',
    component: FirebaseRegisterView,
  },

  // === Book & API Pages ===
  {
    path: '/addbook',
    name: 'AddBook',
    component: AddBookView,
  },
  {
    path: '/getbookcount',
    name: 'GetBookCount',
    component: GetBookCountView,
  },
  {
    path: '/countbookapi',
    name: 'CountBookAPI',
    component: CountBookAPI,
  },

  // === Utility Features ===
  {
    path: '/email',
    name: 'SendEmail',
    component: SendEmailView,
  },
  {
    path: '/weather',
    name: 'WeatherCheck',
    component: WeatherView,
  },
  {
    path: '/interactive',
    name: 'InteractiveTables',
    component: InteractiveTables,
  },
  {
    path: '/interactivecharts',
    name: 'InteractiveCharts',
    component: InteractiveChartsView,
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('@/views/MapView.vue'),
  },
  {
    path: '/addbook1',
    name: 'MapView1',
    component: () => import('@/views/MapView1.vue'),
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: AccessDeniedView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ===== Navigation Guard (keep simple) =====
router.beforeEach((to, from, next) => {

  next()
})

export default router
