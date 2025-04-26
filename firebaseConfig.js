import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg8WiIUaIivMEuzMyQNnCK-Eki3wXwQFQ",
  authDomain: "aurora-viking-shifts.firebaseapp.com",
  projectId: "aurora-viking-shifts",
  storageBucket: "aurora-viking-shifts.firebasestorage.app",
  messagingSenderId: "905397555592",
  appId: "1:905397555592:web:449970d05dbbf2767daa3d",
  measurementId: "G-EGV1ECXWB2"
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app); // Global db
