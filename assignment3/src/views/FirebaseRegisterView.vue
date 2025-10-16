<template>
    <h1>Create an Account</h1>
    <p><input type="text" placeholder="Email" v-model="email" /></p>
    <p><input type="password" placeholder="Password" v-model="password"></p>
    <p>
        <select v-model="role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
        </select>
    </p>
    <p><button @click="register">Save to Firebase</button></p>
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
        })
}
</script>