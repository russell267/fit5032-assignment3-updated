<template>
  <div class="about page-wrap">
    <BHeader />


    <div class="hero-wrap">
      <div class="hero">
        <h1>About Men's Health</h1>
        <p>
          We're dedicated to providing accessible, high-quality books and resources
          focused on men's wellness-mind, body, and lifestyle.
        </p>
        <div class="title-divider"></div>
      </div>
    </div>


    <div class="container-lg py-4">
      <div class="row g-4">

        <div class="col-lg-8">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="section-card h-100">
                <div class="section-header">
                  <i class="bi bi-bullseye me-2 text-sky-700"></i>
                  <span>Our Mission</span>
                </div>
                <p class="mb-0 text-secondary mt-2">
                  To provide accessible, high-quality educational resources to students, researchers,
                  and community members interested in men's health and longevity.
                </p>
              </div>
            </div>

            <div class="col-md-6">
              <div class="section-card h-100">
                <div class="section-header">
                  <i class="bi bi-collection me-2 text-sky-700"></i>
                  <span>Our Collection</span>
                </div>
                <p class="mb-0 text-secondary mt-2">
                  Books, journals, databases, and multimedia-curated across nutrition, exercise,
                  mental fitness, cardiovascular health, and healthy aging.
                </p>
              </div>
            </div>
          </div>

          <div class="section-card mt-4">
            <div class="section-header">
              <i class="bi bi-envelope-paper me-2 text-sky-700"></i>
              <span>Contact Information</span>
            </div>

            <ul class="list-unstyled mt-3 mb-0 contact-list">
              <li><span class="label">Email</span> menhealth@example.com</li>
              <li><span class="label">Phone</span> +61 411196315</li>
              <li><span class="label">Address</span>313 latrobe st</li>
            </ul>
          </div>
        </div>


        <div class="col-lg-4">
          <div
            v-if="isAuthenticated"
            class="auth-card section-card p-0 overflow-hidden"
          >
            <div class="auth-head auth-head--success">
              <div class="d-flex align-items-center">
                <i class="bi bi-unlock fs-5 me-2"></i>
                <strong>Logged In</strong>
              </div>
            </div>
            <div class="p-3">
              <p class="mb-3 text-secondary">
                Welcome, <strong>{{ currentUser }}</strong>! You are successfully logged in.
              </p>
              <button @click="handleLogout" class="btn-ui pill danger w-100">
                <i class="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          </div>

          <div
            v-else
            class="auth-card section-card p-0 overflow-hidden"
          >
            <div class="auth-head auth-head--warn">
              <div class="d-flex align-items-center">
                <i class="bi bi-lock fs-5 me-2"></i>
                <strong>Not Logged In</strong>
              </div>
            </div>
            <div class="p-3">
              <p class="mb-3 text-secondary">
                Please log in to access all features.
              </p>
              <router-link to="/FireLogin" class="btn-ui pill primary w-100 text-center">
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


.hero-wrap {
  padding: 28px 16px 6px;
  background:
    radial-gradient(1200px 400px at 50% -120px, rgba(14,165,233,.18), transparent 60%),
    #f7f9fb;
}
.hero {
  max-width: 1000px;
  margin: 0 auto 18px;
  padding: 24px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #111827 100%);
  color: #fff;
  text-align: center;
  box-shadow: 0 12px 28px rgba(30, 58, 138, 0.25);
}
.hero h1 {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: .2px;
  margin-bottom: 6px;
}
.hero p {
  margin: 0;
  opacity: .92;
  font-size: 14px;
}
.title-divider {
  width: 80px;
  height: 4px;
  margin: 14px auto 0;
  background: #38bdf8;
  border-radius: 999px;
}


.section-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef2f7;
  box-shadow: 0 6px 18px rgba(2,6,23,.06);
  padding: 16px 18px 18px;
}
.section-card:hover {
  box-shadow: 0 10px 28px rgba(2,6,23,.08);
}
.section-header {
  font-weight: 700;
  display: flex;
  align-items: center;
  font-size: 1.05rem;
  color: #0f172a;
}


.contact-list { line-height: 1.9; }
.contact-list .label {
  width: 92px;
  display: inline-block;
  color: #0f172a;
  font-weight: 700;
}


.auth-card { border: none; }
.auth-head {
  color: #0f172a;
  padding: .75rem 1rem;
  border-bottom: 1px solid rgba(2,6,23,.06);
}
.auth-head--warn {
  background: linear-gradient(90deg, #fde68a, #fbbf24);
}
.auth-head--success {
  background: linear-gradient(90deg, #a7f3d0, #34d399);
}


.text-secondary { color: #6b7280 !important; }


.btn-ui {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .6rem 1.1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: .95rem;
  transition: all .18s ease;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #0f172a;
  text-decoration: none;
}
.btn-ui:hover { background: #f8fafc; transform: translateY(-1px); }
.btn-ui.w-100 { width: 100%; }

.btn-ui.primary {
  background: #1e3a8a;
  color: #fff;
  border-color: #1e3a8a;
  box-shadow: 0 6px 14px rgba(30,58,138,.18);
}
.btn-ui.primary:hover { background: #2a50b1; }

.btn-ui.danger {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
  box-shadow: 0 6px 14px rgba(239,68,68,.18);
}
.btn-ui.danger:hover { background: #f05252; }


@media (max-width: 576px) {
  .section-card { padding: 14px 14px 16px; }
  .hero { border-radius: 14px; }
}
</style>
