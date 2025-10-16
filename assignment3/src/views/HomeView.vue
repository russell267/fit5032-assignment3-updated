<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import BHeader from '../components/BHeader.vue';

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  isAustralian: false,
  reason: '',
  gender: '',
  suburb: 'Clayton'
});

const submittedCards = ref([]);
const isAuthenticated = ref(false);
const currentUser = ref('');
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

const errors = ref({
  username: null,
  password: null,
  confirmPassword: null,
  resident: null,
  gender: null,
  reason: null
});

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters';
  } else errors.value.username = null;
};

const validatePassword = (blur) => {
  const password = formData.value.password;
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>"]/.test(password);

  if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long. `;
  } else if (!hasUppercase) {
    if (blur) errors.value.password = 'Password must contain at least one uppercase letter.';
  } else if (!hasLowercase) {
    if (blur) errors.value.password = 'Password must contain at least one lowercase letter.';
  } else if (!hasNumber) {
    if (blur) errors.value.password = 'Password must contain at least one number.';
  } else if (!hasSpecialChar) {
    if (blur) errors.value.password = 'Password must contain at least one special character.';
  } else errors.value.password = null;
};

const validateConfirmPassword = (blur) => {
  if (formData.value.password !== formData.value.confirmPassword) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match.';
  } else errors.value.confirmPassword = null;
};

const validateReason = (blur) => {
  if (formData.value.reason.length < 10) {
    if (blur) errors.value.reason = 'Reason must be at least 10 characters';
  } else errors.value.reason = null;
};

const submitForm = () => {
  validateName(true);
  validatePassword(true);
  validateConfirmPassword(true);
  validateReason(true);

  if (
    !errors.value.username &&
    !errors.value.password &&
    !errors.value.confirmPassword &&
    !errors.value.reason &&
    formData.value.gender &&
    formData.value.reason
  ) {
    submittedCards.value.push({ ...formData.value });
    clearForm();
    Object.keys(errors.value).forEach((k) => (errors.value[k] = null));
  }
};

const clearForm = () => {
  formData.value = {
    username: '',
    password: '',
    confirmPassword: '',
    isAustralian: false,
    reason: '',
    gender: '',
    suburb: 'Clayton'
  };
  Object.keys(errors.value).forEach((k) => (errors.value[k] = null));
};
</script>

<template>
  <!-- Top Nav -->
  <BHeader />

  <!-- Page Wrapper with subtle background -->
  <div class="page-wrap py-4">
    <div class="container-lg">

      <!-- Title block -->
      <div class="title-block text-center">
        <div class="d-inline-flex justify-content-center align-items-center gap-2">
          <h1 class="page-title mb-0">Men's health</h1>
          <i class="bi bi-server text-muted fs-4"></i>
        </div>
        <p class="subtitle text-muted mt-2">
          This form includes validation. Registered users appear below in a data table (PrimeVue).
        </p>
        <div class="title-divider mx-auto"></div>
      </div>

      <!-- Status Alert -->
      <div
        v-if="isAuthenticated"
        class="alert alert-success soft-shadow rounded-3 mb-4"
        role="alert"
      >
        <i class="bi bi-check-circle me-2"></i>
        <strong>Welcome back, {{ currentUser }}!</strong> You are logged in and can access the About page.
      </div>
      <div
        v-else
        class="alert alert-info soft-shadow rounded-3 mb-4"
        role="alert"
      >
        <i class="bi bi-info-circle me-2"></i>
        <strong>Guest User:</strong> You can use the form, but please
        <router-link to="/FireLogin" class="alert-link">login</router-link>
        to access the About page.
      </div>

      <!-- Form Card -->
      <div class="section-card mb-5">
        <div class="section-header">
          <i class="bi bi-pencil-square me-2"></i>
          <span>Registration Form</span>
        </div>

        <form @submit.prevent="submitForm" class="mt-3">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="username" class="form-label">Username</label>
              <input
                type="text"
                id="username"
                class="form-control form-control-lg"
                v-model="formData.username"
                @blur="() => validateName(true)"
                @input="() => validateName(false)"
                placeholder="e.g. RKent"
              />
              <div v-if="errors.username" class="invalid-hint">{{ errors.username }}</div>
            </div>

            <div class="col-md-6">
              <label for="gender" class="form-label">Gender</label>
              <select
                id="gender"
                class="form-select form-select-lg"
                required
                v-model="formData.gender"
              >
                <option value="">Please select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="col-md-6">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                id="password"
                class="form-control form-control-lg"
                v-model="formData.password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
                placeholder="At least 8 chars incl. Aa1!"
              />
              <div v-if="errors.password" class="invalid-hint">{{ errors.password }}</div>
            </div>

            <div class="col-md-6">
              <label for="confirm-password" class="form-label">Confirm password</label>
              <input
                type="password"
                id="confirm-password"
                class="form-control form-control-lg"
                v-model="formData.confirmPassword"
                @blur="() => validateConfirmPassword(true)"
                @input="() => validateConfirmPassword(false)"
                placeholder="Re-enter password"
              />
              <div v-if="errors.confirmPassword" class="invalid-hint">{{ errors.confirmPassword }}</div>
            </div>

            <div class="col-md-6 d-flex align-items-center">
              <div class="form-check mt-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="isAustralian"
                  v-model="formData.isAustralian"
                />
                <label class="form-check-label" for="isAustralian">Australian Resident?</label>
              </div>
            </div>

            <div class="col-12">
              <label for="reason" class="form-label">Reason for joining</label>
              <textarea
                id="reason"
                class="form-control form-control-lg"
                rows="4"
                minlength="10"
                maxlength="100"
                v-model="formData.reason"
                @blur="() => validateReason(true)"
                @input="() => validateReason(false)"
                placeholder="Tell us briefly why you are joining (10–100 chars)"
              ></textarea>
              <div v-if="errors.reason" class="invalid-hint">{{ errors.reason }}</div>
            </div>

            <div class="col-md-6">
              <label for="suburb" class="form-label">Suburb</label>
              <input
                id="suburb"
                type="text"
                class="form-control form-control-lg"
                v-bind:value="formData.suburb"
                readonly
              />
            </div>
          </div>

          <div class="text-center mt-4">
            <button type="submit" class="btn btn-primary btn-lg px-4 me-2 rounded-pill">
              <i class="bi bi-send me-1"></i> Submit
            </button>
            <button type="button" class="btn btn-outline-secondary btn-lg px-4 rounded-pill" @click="clearForm">
              Clear
            </button>
          </div>
        </form>
      </div>

      <!-- DataTable Card -->
      <div class="section-card mb-5">
        <div class="section-header">
          <i class="bi bi-table me-2"></i>
          <span>Registered Users (PrimeVue)</span>
        </div>

        <div class="mt-3">
          <DataTable
            :value="submittedCards"
            paginator
            :rows="5"
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            class="p-datatable-sm table-radius"
          >
            <Column field="username" header="Username" sortable />
            <Column field="password" header="Password" sortable>
              <template #body="slotProps">
                <span v-if="slotProps.data.username === 'RKent'">
                  {{ slotProps.data.password }} ***
                </span>
                <span v-else>
                  {{ slotProps.data.password }}
                </span>
              </template>
            </Column>
            <Column field="isAustralian" header="Australian Resident" sortable>
              <template #body="slotProps">
                {{ slotProps.data.isAustralian ? 'Yes' : 'No' }}
              </template>
            </Column>
            <Column field="gender" header="Gender" sortable />
            <Column field="reason" header="Reason" sortable />
          </DataTable>
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="section-card">
        <div class="section-header">
          <i class="bi bi-people me-2"></i>
          <span>User Cards</span>
        </div>

        <div class="row g-3 mt-1">
          <div class="col-12 col-sm-6 col-lg-4 col-xxl-3" v-for="(user, index) in submittedCards" :key="index">
            <div class="card h-100 soft-shadow rounded-4 border-0">
              <div class="card-header bg-primary text-white rounded-top-4 border-0 py-2">
                <h5 class="card-title mb-0 fs-6"><i class="bi bi-person-badge me-1"></i>User Information</h5>
              </div>
              <div class="card-body">
                <p class="card-text mb-2"><strong>Username:</strong> {{ user.username }}</p>
                <p class="card-text mb-2">
                  <strong>Password:</strong>
                  <span v-if="user.username === 'RKent'">{{ user.password }} ***</span>
                  <span v-else>{{ user.password }}</span>
                </p>
                <p class="card-text mb-2"><strong>Australian Resident:</strong> {{ user.isAustralian ? 'Yes' : 'No' }}</p>
                <p class="card-text mb-2"><strong>Gender:</strong> {{ user.gender }}</p>
                <p class="card-text mb-0"><strong>Reason:</strong> {{ user.reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Page background & max width */
.page-wrap {
  background: #f7f9fb;
}

/* Title */
.page-title {
  letter-spacing: 0.3px;
  font-weight: 700;
}
.subtitle {
  max-width: 920px;
  margin: 0 auto;
}
.title-divider {
  width: 72px;
  height: 4px;
  background: #0d6efd;
  border-radius: 999px;
  margin-top: 12px;
}

/* Cards / sections */
.section-card {
  background: #ffffff;
  border-radius: 1.25rem; /* rounded-4 */
  box-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06);
  padding: 1.25rem 1.25rem 1.5rem;
}
.section-header {
  font-weight: 600;
  display: flex;
  align-items: center;
  font-size: 1.05rem;
}

/* Reusable */
.soft-shadow {
  box-shadow: 0 6px 20px rgba(16, 24, 40, 0.06);
}
.invalid-hint {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* PrimeVue table rounding */
.table-radius :deep(.p-datatable-wrapper) {
  border-radius: 0.75rem;
}

/* Icons */
.bi-server { font-size: 1.25rem; }

/* Buttons */
.btn { transition: transform .05s ease-in-out; }
.btn:active { transform: translateY(1px); }

/* Make inputs feel airy */
.form-control-lg, .form-select-lg { border-radius: 0.75rem; }

/* Responsive tweak */
@media (max-width: 576px) {
  .section-card { padding: 1rem; }
  .subtitle { padding: 0 0.25rem; }
}
</style>
