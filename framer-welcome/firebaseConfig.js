import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8pPyRJz4exkoFV-eAdBaaqr9_NYpR3Jk",
  authDomain: "coaching-3d073.firebaseapp.com",
  projectId: "coaching-3d073",
  storageBucket: "coaching-3d073.firebasestorage.app",
  messagingSenderId: "758157936375",
  appId: "1:758157936375:web:d39f6baa74585b314735f2",
  measurementId: "G-54BXXMVGH9"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };