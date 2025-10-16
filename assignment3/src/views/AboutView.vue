<template>
  <div class="about">
    <!-- Bootstrap Header -->
    <BHeader />

    <div class="container mt-4">
      <div class="row">
        <div class="col-md-8">
          <h1>About Our Library</h1>
          <p class="lead">Welcome to our digital library! We're dedicated to providing a vast collection of books and
            resources to our community.</p>

          <div class="row mt-4">
            <div class="col-md-6">
              <h3>Our Mission</h3>
              <p>To provide accessible, high-quality educational resources to students, researchers, and community
                members.</p>
            </div>
            <div class="col-md-6">
              <h3>Our Collection</h3>
              <p>We offer a comprehensive range of digital and physical resources including books, journals, databases,
                and multimedia content.</p>
            </div>
          </div>

          <div class="mt-4">
            <h3>Contact Information</h3>
            <p><strong>Email:</strong> library@example.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Library Street, City, State 12345</p>
          </div>
        </div>

        <div class="col-md-4" v-if="isAuthenticated">
          <div class="card">
            <div class="card-header bg-success text-white">
              <h5 class="mb-0">Welcome, {{ currentUser }}!</h5>
            </div>
            <div class="card-body">
              <p class="card-text">You are successfully logged in to the library system.</p>
              <div class="d-grid">
                <button @click="handleLogout" class="btn btn-outline-danger">
                  <i class="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4" v-else>
          <div class="card">
            <div class="card-header bg-warning text-dark">
              <h5 class="mb-0">Not Logged In</h5>
            </div>
            <div class="card-body">
              <p class="card-text">Please log in to access all features.</p>
              <div class="d-grid">
                <router-link to="/FireLogin" class="btn btn-primary">
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth";
import BHeader from '../components/BHeader.vue';

const router = useRouter();
const currentUser = ref('');
const isAuthenticated = ref(false);
const auth = getAuth();

onMounted(() => {
  // Listen to Firebase auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      currentUser.value = user.email;
      console.log('Firebase user logged in:', user.email);
    } else {
      isAuthenticated.value = false;
      currentUser.value = '';
      console.log('Firebase user logged out');
    }
  });
});

const handleLogout = async () => {
  console.log('Current user before logout:', currentUser.value);
  try {
    await signOut(auth);
    console.log('Current user after logout:', currentUser.value);
    router.push('/FireLogin');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<style>
.about {
  min-height: 100vh;
}

.about h1 {
  color: #333;
  margin-bottom: 1rem;
}

.about h3 {
  color: #495057;
  margin-bottom: 1rem;
}

.about p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #666;
}

.about .lead {
  font-size: 1.25rem;
  font-weight: 300;
}

.card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.btn {
  border-radius: 25px;
  padding: 10px 20px;
}
</style>
