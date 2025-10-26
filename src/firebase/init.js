// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDbQFsk2_ZbfKoJAY71LLpN7k-GiBRremo',
  authDomain: 'week8-jiaquan.firebaseapp.com',
  databaseURL: 'https://week8-jiaquan-default-rtdb.firebaseio.com',
  projectId: 'week8-jiaquan',
  storageBucket: 'week8-jiaquan.firebasestorage.app',
  messagingSenderId: '1004826229486',
  appId: '1:1004826229486:web:74b6de7d96865459be91ff',
}

// Initialize Firebase
initializeApp(firebaseConfig)
const db = getFirestore()
export default db
