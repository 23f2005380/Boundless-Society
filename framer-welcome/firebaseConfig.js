import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAcKKNkCpoD5ny4DCTTj1PtdjDuxd1-pKE",
  authDomain: "boundless-66cbf.firebaseapp.com",
  databaseURL: "https://boundless-66cbf-default-rtdb.firebaseio.com",
  projectId: "boundless-66cbf",
  storageBucket: "boundless-66cbf.firebasestorage.app",
  messagingSenderId: "443654946102",
  appId: "1:443654946102:web:2620230dae889032a70797",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
