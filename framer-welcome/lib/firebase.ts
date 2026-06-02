import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "DISABLED",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "disabled.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "boundless-785f1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "disabled.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000:web:00000000",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://disabled.firebasedatabase.app"
};

// Check if Firebase is actually configured
const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "DISABLED";

let app: any = null;
let auth: any = null;
let db: any = null;
let realtimeDb: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("Firebase initialization error - Firebase features will be disabled:", error);
  }
}

export {app, auth, db, realtimeDb, storage };
export const isFirebaseEnabled = isFirebaseConfigured && !!app;



