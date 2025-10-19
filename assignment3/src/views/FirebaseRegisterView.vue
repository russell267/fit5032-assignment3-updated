<template>
  <div class="page">

    <div class="hero">
      <h1>Create an Account</h1>
      <p>Join the Men's Health community and start your wellness journey.</p>
      <div class="title-divider"></div>
    </div>


    <div class="card">
      <h2 class="card-title">
        <span class="icon">men's health</span>
        Sign Up
      </h2>

      <div class="form space-y-4">
        <div>
          <label class="label">Email</label>
          <input
            type="text"
            v-model="email"
            class="input"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label class="label">Password</label>
          <input
            type="password"
            v-model="password"
            class="input"
            placeholder="Enter your password"
          />
        </div>

        <div>
          <label class="label">Role</label>
          <select v-model="role" class="input select">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div class="actions">
          <button @click="register" class="btn pill primary">
            Create Account
          </button>
          <router-link to="/FireLogin" class="btn pill ghost">
            Already have an account?
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import db from '../firebase/init'
import { useRouter } from 'vue-router'

const email = ref("")
const password = ref("")
const role = ref("user")
const router = useRouter()
const auth = getAuth()

const register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        role: role.value,
        email: userCredential.user.email
      });
      console.log(`Firebase Register Successfully! Role: ${role.value}`)
      router.push("/FireLogin")
    }).catch((error) => {
      console.log(error.code)
      alert('Registration failed: ' + error.code)
    })
}
</script>

<style scoped>

.page {
  min-height: 100vh;
  padding: 28px 16px 60px;
  background: #f8fafc;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}


.hero {
  max-width: 900px;
  margin: 0 auto 22px;
  padding: 22px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #111827 100%);
  color: #fff;
  text-align: center;
  box-shadow: 0 12px 28px rgba(30, 58, 138, 0.25);
}
.hero h1 {
  font-size: 24px;
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


.card {
  max-width: 640px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(2,6,23,.06);
  padding: 18px 20px 20px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e3a8a;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: .2px;
  margin-bottom: 12px;
}
.icon { font-size: 18px; }


.label {
  display: block;
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
  transition: .2s;
  outline: none;
}
.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,.15);
}
.select { appearance: none; background-image: none; }


.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}
.btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all .18s ease;
  text-decoration: none;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { background: #f8fafc; transform: translateY(-1px); }
.btn.pill { border-radius: 9999px; }
.btn.primary {
  background: #1e3a8a;
  color: #fff;
  border-color: #1e3a8a;
  box-shadow: 0 6px 14px rgba(31,58,138,.18);
}
.btn.primary:hover { background: #2a50b1; }
.btn.ghost { border-style: dashed; }


@media (max-width: 480px) {
  .actions { justify-content: stretch; }
  .btn { flex: 1; justify-content: center; }
}
</style>
