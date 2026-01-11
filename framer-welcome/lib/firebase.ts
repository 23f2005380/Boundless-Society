import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDooPH8fHo-_CV2RzQMJlh153r-pTrF2K0",
  authDomain: "boundless-bd1c0.firebaseapp.com",
  projectId: "boundless-bd1c0",
  storageBucket: "boundless-bd1c0.firebasestorage.app",
  messagingSenderId: "980518089352",
  appId: "1:980518089352:web:2c24bc52633a7a22a6e53d",
  measurementId: "G-5HS331KM7P"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
