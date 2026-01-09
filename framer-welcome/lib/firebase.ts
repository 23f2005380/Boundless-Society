import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZwsvvmhm1bJi-DENfDeLWEkLFcmCyUUA",
  authDomain: "boundless-cd2d1.firebaseapp.com",
  projectId: "boundless-cd2d1",
  storageBucket: "boundless-cd2d1.firebasestorage.app",
  messagingSenderId: "123380782108",
  appId: "1:123380782108:web:db73a148f3a98afc657bd9",
  measurementId: "G-EEMHW8WPK7"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
