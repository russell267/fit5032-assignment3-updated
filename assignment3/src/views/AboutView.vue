<template>
  <div class="about page-wrap">

    <BHeader />

    <div class="container-lg py-4">

      <div class="hero text-center mb-4">
        <h1 class="display-6 fw-bold mb-1">About Men's health</h1>
        <p class="text-muted lead mb-2">
          Welcome to our Men's health website! We're dedicated to providing a vast collection of books and resources related to the men's health.
        </p>
        <div class="title-divider mx-auto"></div>
      </div>

      <div class="row g-4">

        <div class="col-lg-8">
          <!-- Mission & Collection -->
          <div class="row g-4">
            <div class="col-md-6">
              <div class="section-card h-100">
                <div class="section-header">
                  <i class="bi bi-bullseye me-2"></i>
                  <span>Our Mission</span>
                </div>
                <p class="mb-0 text-secondary mt-2">
                  To provide accessible, high-quality educational resources to students, researchers, and community members.
                </p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="section-card h-100">
                <div class="section-header">
                  <i class="bi bi-collection me-2"></i>
                  <span>Our Collection</span>
                </div>
                <p class="mb-0 text-secondary mt-2">
                  We offer a comprehensive range of digital and physical resources, including books, journals, databases, and multimedia content.
                </p>
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="section-card mt-4">
            <div class="section-header">
              <i class="bi bi-envelope-paper me-2"></i>
              <span>Contact Information</span>
            </div>
            <ul class="list-unstyled mt-2 mb-0 contact-list">
              <li><span class="label">Email</span> library@example.com</li>
              <li><span class="label">Phone</span> +1 (555) 123-4567</li>
              <li><span class="label">Address</span> 123 Library Street, City, State 12345</li>
            </ul>
          </div>
        </div>


        <div class="col-lg-4">
          <div v-if="isAuthenticated" class="auth-card section-card p-0 overflow-hidden">
            <div class="auth-head auth-head--success">
              <div class="d-flex align-items-center">
                <i class="bi bi-unlock fs-5 me-2"></i>
                <strong>Logged In</strong>
              </div>
            </div>
            <div class="p-3">
              <p class="mb-3 text-secondary">Welcome, <strong>{{ currentUser }}</strong>! You are successfully logged in.</p>
              <button @click="handleLogout" class="btn btn-outline-danger w-100 rounded-pill">
                <i class="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>

          <div v-else class="auth-card section-card p-0 overflow-hidden">
            <div class="auth-head auth-head--warn">
              <div class="d-flex align-items-center">
                <i class="bi bi-lock fs-5 me-2"></i>
                <strong>Not Logged In</strong>
              </div>
            </div>
            <div class="p-3">
              <p class="mb-3 text-secondary">Please log in to access all features.</p>
              <router-link to="/FireLogin" class="btn btn-primary w-100 rounded-pill">
                <i class="bi bi-box-arrow-in-right me-1"></i> Login
              </router-link>
            </div>
          </div>


          <div class="hint mt-3 text-muted small">
            Tip: Create an account to bookmark books, see your history, and access members-only resources.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { onAuthStateChanged, signOut, getAuth } from 'firebase/auth';
import BHeader from '../components/BHeader.vue';

const router = useRouter();
const currentUser = ref('');
const isAuthenticated = ref(false);
const auth = getAuth();

onMounted(() => {
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
  try {
    await signOut(auth);
    router.push('/FireLogin');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>

.page-wrap {
  background: #f7f9fb;
  min-height: 100vh;
}


.hero .display-6 {
  letter-spacing: .3px;
}
.title-divider {
  width: 72px;
  height: 4px;
  background: #0d6efd;
  border-radius: 999px;
}


.section-card {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px rgba(16,24,40,.06);
  padding: 1rem 1.25rem 1.25rem;
}
.section-header {
  font-weight: 600;
  display: flex;
  align-items: center;
  font-size: 1.05rem;
}


.contact-list .label {
  width: 92px;
  display: inline-block;
  color: #0f172a;
  font-weight: 600;
}


.auth-card { border: none; }
.auth-head {
  color: #0f172a;
  padding: .75rem 1rem;
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.auth-head--warn {
  background: linear-gradient(90deg, #ffd54f, #ffca28);
}
.auth-head--success {
  background: linear-gradient(90deg, #a8e6cf, #88d8b0);
}


.text-secondary { color: #6b7280 !important; }
.btn { transition: transform .05s ease-in-out; }
.btn:active { transform: translateY(1px); }


@media (max-width: 576px) {
  .section-card { padding: .85rem 1rem 1rem; }
}
</style>
