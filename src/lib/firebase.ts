import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App (prevents re-initialization on Next.js hot reload / SSR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Suppress internal Firestore connection retry logs from clogging Next.js dev overlay
setLogLevel("error");

// Initialize Cloud Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Explicitly set browserLocalPersistence so session persists across refresh/tab close
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Failed to set auth persistence:", err);
  });
}

export { app, db, auth };
