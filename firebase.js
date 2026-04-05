import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNUj-KRSYEzOI_7SFB1z1c_Rsq4zkOkjM",
  authDomain: "rc-zone-28138.firebaseapp.com",
  projectId: "rc-zone-28138",
  storageBucket: "rc-zone-28138.firebasestorage.app",
  messagingSenderId: "968913615753",
  appId: "1:968913615753:web:ac7b48eb81e0180042bf58"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
