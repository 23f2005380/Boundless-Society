// lib/firebase-admin-secondary.ts
// Secondary Firebase Admin — boundless-recovery project
// Used as overflow when the primary Firebase (boundless-785f1) quota is exceeded.
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SECONDARY_APP_NAME = "boundless-recovery";

function getSecondaryApp() {
  try {
    return getApp(SECONDARY_APP_NAME);
  } catch {
    // App not initialized yet
    return initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_SECONDARY_PROJECT_ID,
          clientEmail: process.env.FIREBASE_SECONDARY_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_SECONDARY_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        } as Parameters<typeof cert>[0]),
      },
      SECONDARY_APP_NAME
    );
  }
}

export function getSecondaryDb() {
  return getFirestore(getSecondaryApp());
}
