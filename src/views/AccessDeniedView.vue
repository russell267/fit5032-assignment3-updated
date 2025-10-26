<template>
  <div class="access-denied-container">
    <!-- Bootstrap Header -->
    <BHeader />
    
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <div class="card shadow">
            <div class="card-body">
              <div class="mb-4">
                <i class="bi bi-shield-exclamation text-danger" style="font-size: 4rem;"></i>
              </div>
              <h2 class="text-danger mb-3">Access Denied</h2>
              <p class="lead mb-4">
                Sorry, you don't have permission to access this page. 
                Please log in to continue.
              </p>
              <div class="d-flex justify-content-center gap-3">
                <router-link to="/login" class="btn btn-primary">
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Go to Login
                </router-link>
                <router-link to="/" class="btn btn-outline-secondary">
                  <i class="bi bi-house me-2"></i>
                  Back to Home
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
import BHeader from '../components/BHeader.vue';
</script>

<style scoped>
.access-denied-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  border: none;
  border-radius: 15px;
}

.bi-shield-exclamation {
  color: #dc3545;
}

.btn {
  border-radius: 25px;
  padding: 10px 20px;
}
</style>
