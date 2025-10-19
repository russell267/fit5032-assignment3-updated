<template>
  <div class="page">


    <BHeader />

    <section class="hero">
      <h1>Men's Health Profile</h1>
      <p>Empowering wellness and awareness-track, learn, and grow together.</p>
      <div class="title-divider"></div>
    </section>

    <div class="container-lg">
      <div
        v-if="isAuthenticated"
        class="alert-card success"
      >
        <i class="bi bi-person-check me-2"></i>
        Welcome back, <strong>{{ currentUser }}</strong>! You're logged in and can access member features.
      </div>

      <div
        v-else
        class="alert-card info"
      >
        <i class="bi bi-info-circle me-2"></i>
        Guest user: you can fill the form, but please
        <router-link to="/FireLogin" class="alert-link"> log in</router-link>
        for full access.
      </div>

      <div class="card">
        <h2 class="card-title">
          <i class="bi bi-pencil-square me-2"></i> Health Member Registration
        </h2>

        <form @submit.prevent="submitForm" class="mt-3">
          <div class="grid">
            <div class="field">
              <label>Username</label>
              <input
                v-model="formData.username"
                @blur="() => validateName(true)"
                @input="() => validateName(false)"
                placeholder="e.g. JohnFit"
              />
              <p v-if="errors.username" class="invalid">{{ errors.username }}</p>
            </div>

            <div class="field">
              <label>Gender</label>
              <select v-model="formData.gender">
                <option value="">Please select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="field">
              <label>Password</label>
              <input
                type="password"
                v-model="formData.password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
                placeholder="At least 8 chars incl. Aa1!"
              />
              <p v-if="errors.password" class="invalid">{{ errors.password }}</p>
            </div>

            <div class="field">
              <label>Confirm Password</label>
              <input
                type="password"
                v-model="formData.confirmPassword"
                @blur="() => validateConfirmPassword(true)"
                @input="() => validateConfirmPassword(false)"
                placeholder="Re-enter password"
              />
              <p v-if="errors.confirmPassword" class="invalid">{{ errors.confirmPassword }}</p>
            </div>

            <div class="field checkbox">
              <input type="checkbox" v-model="formData.isAustralian" id="resident" />
              <label for="resident">Australian Resident?</label>
            </div>

            <div class="field col-span-2">
              <label>Reason for Joining</label>
              <textarea
                v-model="formData.reason"
                rows="4"
                minlength="10"
                maxlength="100"
                @blur="() => validateReason(true)"
                @input="() => validateReason(false)"
                placeholder="Tell us briefly why you're joining (10-100 chars)"
              ></textarea>
              <p v-if="errors.reason" class="invalid">{{ errors.reason }}</p>
            </div>

            <div class="field">
              <label>Suburb</label>
              <input readonly v-bind:value="formData.suburb" />
            </div>
          </div>

          <div class="actions">
            <button type="submit" class="btn primary">Submit</button>
            <button type="button" class="btn ghost" @click="clearForm">Clear</button>
          </div>
        </form>
      </div>

      <div class="card mt-5">
        <h2 class="card-title">
          <i class="bi bi-table me-2"></i> Registered Users
        </h2>

        <DataTable
          :value="submittedCards"
          paginator
          :rows="5"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          class="p-datatable-sm mt-3"
        >
          <Column field="username" header="Username" sortable />
          <Column field="gender" header="Gender" sortable />
          <Column field="isAustralian" header="Australian Resident" sortable>
            <template #body="slotProps">
              {{ slotProps.data.isAustralian ? 'Yes' : 'No' }}
            </template>
          </Column>
          <Column field="reason" header="Reason" sortable />
        </DataTable>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'


import BHeader from '@/components/BHeader.vue'

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  isAustralian: false,
  reason: '',
  gender: '',
  suburb: 'Melbourne'
})
const submittedCards = ref([])
const errors = ref({
  username: null,
  password: null,
  confirmPassword: null,
  reason: null
})

const isAuthenticated = ref(false)
const currentUser = ref('')
const auth = getAuth()

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isAuthenticated.value = !!user
    currentUser.value = user?.email || ''
  })
})

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters'
  } else errors.value.username = null
}
const validatePassword = (blur) => {
  const pw = formData.value.password
  const valid = /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[!@#$%^&*]/.test(pw) && pw.length >= 8
  errors.value.password = valid ? null : (blur ? 'Password must meet all complexity requirements' : null)
}
const validateConfirmPassword = (blur) => {
  errors.value.confirmPassword = (formData.value.password !== formData.value.confirmPassword && blur)
    ? 'Passwords do not match' : null
}
const validateReason = (blur) => {
  if (formData.value.reason.length < 10 && blur)
    errors.value.reason = 'Reason must be at least 10 characters'
  else errors.value.reason = null
}

const submitForm = () => {
  validateName(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateReason(true)
  if (!Object.values(errors.value).some(e => e)) {
    submittedCards.value.push({ ...formData.value })
    clearForm()
  }
}
const clearForm = () => {
  formData.value = {
    username: '',
    password: '',
    confirmPassword: '',
    isAustralian: false,
    reason: '',
    gender: '',
    suburb: 'Clayton'
  }
  Object.keys(errors.value).forEach(k => errors.value[k] = null)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f9fb;
  padding-bottom: 60px;
}

.hero {
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  color: #fff;
  text-align: center;
  padding: 3rem 1rem 2.5rem;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
}
.hero h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}
.hero p {
  font-size: 0.95rem;
  opacity: 0.9;
}
.title-divider {
  width: 80px;
  height: 4px;
  background: #38bdf8;
  border-radius: 999px;
  margin: 1rem auto 0;
}

.card {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
  padding: 1.5rem 1.75rem;
  margin-top: 2rem;
}
.card-title {
  font-weight: 700;
  color: #1e3a8a;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem 1.5rem;
}
.field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #0f172a;
  margin-bottom: 4px;
  display: block;
}
.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  background: #fff;
  transition: .2s;
  outline: none;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,.15);
}
.field.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
.invalid {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 4px;
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn {
  border: 1px solid #e5e7eb;
  padding: 10px 18px;
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
}
.btn.primary {
  background: linear-gradient(to right, #f97316, #ea580c);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(234,88,12,0.25);
}
.btn.primary:hover { transform: translateY(-1px); }
.btn.ghost:hover { background: #f9fafb; }

.alert-card {
  border-radius: 12px;
  padding: 12px 18px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}
.alert-card.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.alert-card.info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}
.alert-link {
  color: #2563eb;
  font-weight: 600;
}
</style>
