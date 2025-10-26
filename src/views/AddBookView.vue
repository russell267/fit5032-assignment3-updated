<template>
  <div class="page">

    <div class="hero">
      <h1>Men's Health · Add Book</h1>
      <p>Add a new book to your wellness library.</p>
    </div>


    <div class="card">
      <h2 class="card-title">
        <span class="icon">Book Related to the men's health</span>
        Add Book
      </h2>

      <form class="form" @submit.prevent="addBook">
        <div class="form-row">
          <label for="isbn" class="label">ISBN</label>
          <input
            id="isbn"
            type="text"
            v-model="isbn"
            class="input"
            placeholder="e.g. 9780132350884"
            required
          />
          <p class="hint">Numbers only</p>
        </div>

        <div class="form-row">
          <label for="name" class="label">Name</label>
          <input
            id="name"
            type="text"
            v-model="name"
            class="input"
            placeholder="e.g. Strong Mind, Strong Body"
            required
          />
        </div>

        <div class="actions">
          <button type="submit" class="btn primary pill">
            <i class="fas fa-plus"></i>
            Add a Book
          </button>
          <button type="button" class="btn ghost pill" @click="resetForm">
            <i class="fas fa-rotate-left"></i>
            Reset
          </button>
        </div>
      </form>
    </div>


    <div style="margin-top: 24px"></div>
  </div>
</template>

<script>
import { ref } from 'vue'
import db from '../firebase/init.js'
import { collection, addDoc } from 'firebase/firestore'

export default {
  components: {},
  setup() {
    const isbn = ref('')
    const name = ref('')

    const addBook = async () => {
      try {
        const isbnNumber = Number(isbn.value)
        if (isNaN(isbnNumber)) {
          alert('ISBN must be a valid number')
          return
        }

        await addDoc(collection(db, 'books'), {
          isbn: isbnNumber,
          name: name.value,
        })
        isbn.value = ''
        name.value = ''
        alert('Book added successfully!')
      } catch (e) {
        console.error('Error adding book:', e)
      }
    }

    const resetForm = () => {
      isbn.value = ''
      name.value = ''
    }

    return { isbn, name, addBook, resetForm }
  },
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');

.page {
  min-height: 100vh;
  padding: 28px 16px 60px;
  background: #f8fafc;
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
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: 0.2px;
}
.hero p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}


.card {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.06);
  padding: 18px 20px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e3a8a;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
}
.icon { font-size: 18px; }


.form { display: grid; gap: 14px; }
.form-row { display: grid; gap: 6px; }

.label {
  font-weight: 600;
  font-size: 13px;
  color: #1e3a8a;
}
.input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 14px;
  transition: 0.2s;
  background: #fff;
}
.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}
.hint {
  font-size: 12px;
  color: #94a3b8;
}


.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
.btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { background: #f8fafc; transform: translateY(-1px); }
.btn.pill { border-radius: 9999px; }
.btn.primary {
  background: #1f3a8a;
  color: #fff;
  border-color: #1f3a8a;
  box-shadow: 0 6px 14px rgba(31, 58, 138, 0.18);
}
.btn.primary:hover { background: #2a50b1; }
.btn.ghost { border-style: dashed; }


@media (max-width: 480px) {
  .actions { justify-content: stretch; }
  .btn { flex: 1; text-align: center; justify-content: center; }
}
</style>
