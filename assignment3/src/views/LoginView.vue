<template>
  <div class="login-container">
    <!-- Bootstrap Header -->
    <BHeader />
    
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-header bg-primary text-white text-center">
              <h4 class="mb-0">Library Login</h4>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="username" 
                    v-model="loginForm.username"
                    required
                    placeholder="Enter username"
                  />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input 
                    type="password" 
                    class="form-control" 
                    id="password" 
                    v-model="loginForm.password"
                    required
                    placeholder="Enter password"
                  />
                </div>
                <div v-if="loginError" class="alert alert-danger">
                  {{ loginError }}
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary" :disabled="isLoading">
                    {{ isLoading ? 'Logging in...' : 'Login' }}
                  </button>
                </div>
              </form>
              
              <div class="mt-3 text-center">
                <small class="text-muted">
                  Demo credentials: admin / password123
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BHeader from '../components/BHeader.vue';

const router = useRouter();
const loginForm = ref({
  username: '',
  password: ''
});

const loginError = ref('');
const isLoading = ref(false);


const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'password123'
};

const handleLogin = () => {
  isLoading.value = true;
  loginError.value = '';
  
  
  setTimeout(() => {
    if (loginForm.value.username === VALID_CREDENTIALS.username && 
        loginForm.value.password === VALID_CREDENTIALS.password) {
      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', loginForm.value.username);
      router.push('/about');
    } else {
      
      loginError.value = 'Invalid username or password. Please try again.';
    }
    isLoading.value = false;
  }, 1000);
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  border: none;
  border-radius: 15px;
}

.card-header {
  border-radius: 15px 15px 0 0 !important;
}

.btn-primary {
  border-radius: 25px;
  padding: 10px 20px;
}

.form-control {
  border-radius: 8px;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}
</style>
