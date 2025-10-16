<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h1 class="h3 mb-1">Books</h1>
        <div class="text-muted small">book management</div>
      </div>
      <div class="text-end">
        <span class="badge text-bg-primary me-2">{{ queryLabel }}</span>
        <span class="badge text-bg-secondary">Total: {{ books.length }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="card mb-3">
      <div class="card-body d-flex flex-wrap gap-2 align-items-center">
        <!-- Query Mode -->
        <div class="btn-group" role="group" aria-label="Query type">
          <input
            type="radio"
            class="btn-check"
            id="q-where"
            value="where"
            v-model="queryType"
            @change="fetchBooks"
          />
          <label class="btn btn-outline-primary" for="q-where">WHERE: ISBN &gt; 1000</label>

          <input
            type="radio"
            class="btn-check"
            id="q-order"
            value="order"
            v-model="queryType"
            @change="fetchBooks"
          />
          <label class="btn btn-outline-primary" for="q-order">ORDER BY: Name ASC</label>

          <input
            type="radio"
            class="btn-check"
            id="q-limit"
            value="limit"
            v-model="queryType"
            @change="fetchBooks"
          />
          <label class="btn btn-outline-primary" for="q-limit">LIMIT: 5</label>
        </div>

        <!-- Search box (client-side filter) -->
        <div class="ms-auto d-flex align-items-center" style="min-width: 260px">
          <input
            v-model.trim="search"
            type="search"
            class="form-control"
            placeholder="you need to search your name and ISBN"
            aria-label="Search"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Books List</h5>
        <div v-if="message" class="text-success small">{{ message }}</div>
      </div>

      <div class="card-body p-0">
        <!-- Loading -->
        <div v-if="loading" class="d-flex justify-content-center align-items-center py-5">
          <div class="spinner-border" role="status" aria-label="Loading"></div>
          <span class="ms-2">Loading…</span>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredBooks.length === 0" class="text-center py-5 text-muted">
          <div class="mb-2">没有匹配的结果</div>
          <div class="small">试试更换查询模式或清空搜索</div>
        </div>

        <!-- Data -->
        <div v-else class="table-responsive">
          <table class="table table-striped table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 45%">Name</th>
                <th style="width: 25%">ISBN</th>
                <th style="width: 30%" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="book in filteredBooks" :key="book.id">
                <td>
                  <input
                    v-if="editingBook === book.id"
                    v-model="editForm.name"
                    class="form-control"
                    placeholder="Book name"
                  />
                  <span v-else class="fw-medium">{{ book.name }}</span>
                </td>
                <td>
                  <input
                    v-if="editingBook === book.id"
                    v-model="editForm.isbn"
                    class="form-control"
                    placeholder="ISBN (number)"
                    inputmode="numeric"
                  />
                  <span v-else class="text-monospace">{{ book.isbn }}</span>
                </td>
                <td class="text-end">
                  <div v-if="editingBook === book.id" class="d-inline-flex gap-2">
                    <button
                      @click="saveBook(book.id)"
                      class="btn btn-success btn-sm"
                      :disabled="opBusy"
                    >
                      {{ opBusy ? 'Saving…' : 'Save' }}
                    </button>
                    <button @click="cancelEdit" class="btn btn-secondary btn-sm" :disabled="opBusy">
                      Cancel
                    </button>
                  </div>
                  <div v-else class="d-inline-flex gap-2">
                    <button @click="editBook(book)" class="btn btn-outline-warning btn-sm">
                      Edit
                    </button>
                    <button
                      @click="deleteBook(book.id)"
                      class="btn btn-outline-danger btn-sm"
                      :disabled="opBusy"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed } from 'vue'
import db from '../firebase/init'
import {
  collection,
  query as fbQuery,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

export default {
  setup() {
    const books = ref([])
    const loading = ref(false)
    const opBusy = ref(false)
    const message = ref('')
    const editingBook = ref(null)
    const editForm = ref({ name: '', isbn: '' })
    const search = ref('')
    const queryType = ref('where') // 'where' | 'order' | 'limit'

    const queryLabel = computed(() => {
      switch (queryType.value) {
        case 'order':
          return 'ORDER BY: name ASC'
        case 'limit':
          return 'LIMIT: 5'
        default:
          return 'WHERE: isbn > 1000'
      }
    })

    const fetchBooks = async () => {
      try {
        loading.value = true
        let q = collection(db, 'books')
        if (queryType.value === 'where') {
          q = fbQuery(q, where('isbn', '>', 1000))
        } else if (queryType.value === 'order') {
          q = fbQuery(q, orderBy('name', 'asc'))
        } else if (queryType.value === 'limit') {
          q = fbQuery(q, limit(5))
        }
        const snapshot = await getDocs(q)
        books.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch (e) {
        console.error('Error fetching:', e)
        message.value = 'Load failed. Check Firestore rules/auth.'
      } finally {
        loading.value = false
      }
    }

    const filteredBooks = computed(() => {
      if (!search.value) return books.value
      const key = search.value.toLowerCase()
      return books.value.filter(
        (b) =>
          String(b.name || '')
            .toLowerCase()
            .includes(key) ||
          String(b.isbn || '')
            .toLowerCase()
            .includes(key),
      )
    })

    const editBook = (book) => {
      editingBook.value = book.id
      editForm.value = { name: book.name, isbn: String(book.isbn ?? '') }
      message.value = ''
    }

    const saveBook = async (bookId) => {
      try {
        opBusy.value = true
        const nextName = (editForm.value.name || '').trim()
        const nextIsbn = Number(editForm.value.isbn)
        if (!nextName) return (message.value = 'Name cannot be empty.')
        if (Number.isNaN(nextIsbn)) return (message.value = 'ISBN must be a number.')
        await updateDoc(doc(db, 'books', bookId), { name: nextName, isbn: nextIsbn })
        editingBook.value = null
        message.value = 'Book updated!'
        await fetchBooks()
      } catch (e) {
        console.error('Error updating:', e)
        message.value = 'Update failed.'
      } finally {
        opBusy.value = false
      }
    }

    const cancelEdit = () => {
      editingBook.value = null
      message.value = ''
    }

    const deleteBook = async (bookId) => {
      if (!confirm('Delete this book?')) return
      try {
        opBusy.value = true
        await deleteDoc(doc(db, 'books', bookId))
        message.value = 'Book deleted!'
        await fetchBooks()
      } catch (e) {
        console.error('Error deleting:', e)
        message.value = 'Delete failed.'
      } finally {
        opBusy.value = false
      }
    }

    onMounted(fetchBooks)

    return {
      // state
      books,
      loading,
      opBusy,
      message,
      editingBook,
      editForm,
      search,
      queryType,
      // computed
      filteredBooks,
      queryLabel,
      // methods
      fetchBooks,
      editBook,
      saveBook,
      cancelEdit,
      deleteBook,
    }
  },
}
</script>

<style scoped>
.text-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}
@media (max-width: 576px) {
  .btn-group .btn {
    font-size: 0.85rem;
  }
  table {
    font-size: 0.95rem;
  }
}
</style>
