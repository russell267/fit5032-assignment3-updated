<template>
    <h1>Sign in</h1>
    <p><input type="text" placeholder="Email" v-model="email" /></p>
    <p><input type="password" placeholder="Password" v-model="password"></p>
    <p><button @click="signin">Sign in via Firebase</button></p>
    
    <div v-if="currentUser" style="margin-top: 20px; padding: 10px; background: #f0f0f0;">
        <h3>Logged in as:</h3>
        <p><strong>Email:</strong> {{ currentUser.email }}</p>
        <p><strong>Role:</strong> {{ userRole }}</p>
        <button @click="logout" style="margin-top: 10px;">Logout</button>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import db from '../firebase/init'
import { useRouter } from 'vue-router'
const email = ref("")
const password = ref("")
const currentUser = ref(null)
const userRole = ref("")
const router = useRouter()
const auth = getAuth()

onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser.value = user
            // Get user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid))
            userRole.value = userDoc.exists() ? userDoc.data().role : 'unknown'
            console.log(`User logged in: ${user.email}, Role: ${userRole.value}`)
        } else {
            currentUser.value = null
            userRole.value = ""
        }
    })
})

const signin = () => {
    signInWithEmailAndPassword(auth, email.value, password.value)
        .then(() => {
            console.log("Firebase Login Successful!")
            router.push("/")
        }).catch((error) => {
            console.log(error.code)
        })
}

const logout = () => {
    signOut(auth).then(() => {
        console.log("User logged out")
    })
}
</script>