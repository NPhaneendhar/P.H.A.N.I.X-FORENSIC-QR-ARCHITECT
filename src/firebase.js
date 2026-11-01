import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDN8X8G32ComnhNimt90oyQo-w8nLiUFyg",
    authDomain: "phanix-qr.firebaseapp.com",
    projectId: "phanix-qr",
    storageBucket: "phanix-qr.firebasestorage.app",
    messagingSenderId: "879955925261",
    appId: "1:879955925261:web:c6554956edc1f5f654b844"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);