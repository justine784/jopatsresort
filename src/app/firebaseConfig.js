
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCg-6yQnCvn-ULguPd89aA5XnoAEi_og_k",
  authDomain: "jopatsresort-e54e4.firebaseapp.com",
  projectId: "jopatsresort-e54e4",
  storageBucket: "jopatsresort-e54e4.firebasestorage.app",
  messagingSenderId: "1071508928642",
  appId: "1:1071508928642:web:d29925f91694119ec39c9b",
  measurementId: "G-3860MJ9GQ5"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };