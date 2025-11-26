// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDVC6vomo8hXU8qAIfWn2DIyv6R-ogiwC4",
    authDomain: "removie-d1ee4.firebaseapp.com",
    projectId: "removie-d1ee4",
    storageBucket: "removie-d1ee4.firebasestorage.app",
    messagingSenderId: "713372887235",
    appId: "1:713372887235:web:fa59f927112ba2c02b9a76",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {
});

export const db = getFirestore(app);