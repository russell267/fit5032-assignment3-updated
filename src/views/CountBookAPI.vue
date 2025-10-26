<template>
  <div class="count-book-api">
    <h2>Book Count (Cloud Function)</h2>

    <div v-if="error">
      <p style="color: red">❌ Error: {{ error.message }}</p>
    </div>

    <div v-else-if="jsondata">
      <pre>{{ jsondata }}</pre>
    </div>

    <div v-else>
      <p>Loading data from Cloud Function...</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CountBookAPI',

  data() {
    return {
      jsondata: null,
      error: null,
    }
  },

  async mounted() {
    await this.getBookCountAPI()
  },

  methods: {
    async getBookCountAPI() {
      try {
        
        const response = await axios.get('https://countbooks-agpbs5a2mq-uc.a.run.app')
        this.jsondata = response.data
        this.error = null
      } catch (error) {
        console.error('Error fetching book count:', error)
        this.error = error
        this.jsondata = null
      }
    },
  },
}
</script>

<style scoped>
.count-book-api {
  text-align: center;
  margin-top: 50px;
}
pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  text-align: left;
}
</style>
