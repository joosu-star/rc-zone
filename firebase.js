// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNUj-KRSYEzOI_7SFB1z1c_Rsq4zkOkjM",
  authDomain: "rc-zone-28138.firebaseapp.com",
  projectId: "rc-zone-28138",
  storageBucket: "rc-zone-28138.firebasestorage.app",
  messagingSenderId: "968913615753",
  appId: "1:968913615753:web:ac7b48eb81e0180042bf58",
  measurementId: "G-NQMY7GQH4F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
