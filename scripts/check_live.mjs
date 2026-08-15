import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  const envConfig = fs.readFileSync(".env.local", "utf-8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkLive() {
  console.log("================ CHECKING LIVE FIRESTORE COLLECTIONS ================");

  // 1. galleryImages
  try {
    const gSnap = await getDocs(collection(db, "galleryImages"));
    console.log(`\n'galleryImages' count: ${gSnap.size}`);
    gSnap.docs.forEach((d) => {
      console.log(`Doc [${d.id}]:`, Object.keys(d.data()), "images len:", (d.data().images || []).length);
    });
  } catch (e) {
    console.error("Error reading galleryImages:", e.message);
  }

  // 2. internships
  try {
    const iSnap = await getDocs(collection(db, "internships"));
    console.log(`\n'internships' count: ${iSnap.size}`);
    iSnap.docs.forEach((d) => {
      console.log(`Doc [${d.id}]:`, Object.keys(d.data()));
    });
  } catch (e) {
    console.error("Error reading internships:", e.message);
  }

  // 3. siteContent
  try {
    const sSnap = await getDocs(collection(db, "siteContent"));
    console.log(`\n'siteContent' count: ${sSnap.size}`);
    sSnap.docs.forEach((d) => {
      console.log(`Doc [${d.id}]`);
    });
  } catch (e) {
    console.error("Error reading siteContent:", e.message);
  }

  process.exit(0);
}

checkLive();
