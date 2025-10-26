<template>
  <!-- Using Bootstrap's Header template (starter code) -->
  <!-- https://getbootstrap.com/docs/5.0/examples/headers/ -->
  <div class="container">
    <header class="d-flex justify-content-center py-3">
      <ul class="nav nav-pills">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="active" aria-current="page"
            >Home</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/about" class="nav-link" active-class="active">About</router-link>
        </li>

        <!-- Conditional rendering based on authentication status -->
        <li class="nav-item">
          <router-link to="/addbook" class="nav-link" active-class="active">Add Book</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/addbook1" class="nav-link" active-class="active">Map1</router-link>
        </li>
        <li class="nav-item" v-if="!isAuthenticated">
          <router-link to="/FireLogin" class="nav-link" active-class="active">Login</router-link>
        </li>
        <li class="nav-item" v-else>
          <button @click="handleLogout" class="nav-link btn btn-link">
            Logout ({{ currentUser }})
          </button>
        </li>
        <li class="nav-item">
          <router-link to="/FireLogin" class="nav-link" active-class="active"
            >Firebase Login</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/GetBookCount" class="nav-link" active-class="active"
            >Firebase Login</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/map" class="nav-link" active-class="active"
            >Get Map</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/email" class="nav-link" active-class="active"
            >Send Email</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/interactive" class="nav-link" active-class="active"
            >Interactive Table</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/interactivecharts" class="nav-link" active-class="active"
            >Data Visualise</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/CountBookAPI" class="nav-link" active-class="active"
            >Count Book API</router-link
          >
        </li>
        <li class="nav-item">
          <router-link to="/FireRegister" class="nav-link" active-class="active"
            >Authentication</router-link
          >
        </li>
      </ul>
    </header>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut, getAuth } from 'firebase/auth'

const router = useRouter()
const isAuthenticated = ref(false)
const currentUser = ref('')
const auth = getAuth()

onMounted(() => {
  // Listen to Firebase auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      currentUser.value = user.email
      console.log('Firebase user logged in:', user.email)
    } else {
      isAuthenticated.value = false
      currentUser.value = ''
      console.log('Firebase user logged out')
    }
  })
})

const handleLogout = async () => {
  console.log('Current user before logout:', currentUser.value)
  try {
    await signOut(auth)
    console.log('Current user after logout:', currentUser.value)
    router.push('/FireLogin')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.nav-pills .nav-link.active {
  background-color: #0d6efd;
  color: white;
}

.nav-pills .nav-link {
  color: #0d6efd;
  margin: 0 5px;
}

.nav-pills .nav-link:hover {
  background-color: #e9ecef;
}

.btn-link {
  text-decoration: none;
  background: none;
  border: none;
  color: #0d6efd;
  padding: 0.5rem 1rem;
}

.btn-link:hover {
  background-color: #e9ecef;
  color: #0d6efd;
}
</style>
