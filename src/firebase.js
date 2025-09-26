// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { collection } from "firebase/firestore";
// import { getFirestore } from "firebase/firestore/lite";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1UzzfWgD5vVgkHX1B0iZQVdJd-bfmg7M",
  authDomain: "gold-price-calculator-learning.firebaseapp.com",
  projectId: "gold-price-calculator-learning",
  storageBucket: "gold-price-calculator-learning.firebasestorage.app",
  messagingSenderId: "8602806911",
  appId: "1:8602806911:web:8e8928d5fbcbf2aef76d4a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Collection reference create karein
export const calculationsCollection = collection(db, "calculations");

export { db };
export default app;