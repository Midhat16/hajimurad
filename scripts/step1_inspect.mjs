import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function inspect() {
  console.log("================ STEP 1: CURRENT FIRESTORE DATA INSPECTION ================");

  // 1. Gallery Collections
  console.log("\n--- Checking 'galleryImages' Collection ---");
  try {
    const snap1 = await getDocs(collection(db, "galleryImages"));
    console.log(`Count in 'galleryImages': ${snap1.size}`);
    snap1.docs.forEach((d) => {
      console.log(`Doc ID: [${d.id}] ->`, JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error("Error inspecting galleryImages:", err.message);
  }

  console.log("\n--- Checking 'gallery' Collection ---");
  try {
    const snap2 = await getDocs(collection(db, "gallery"));
    console.log(`Count in 'gallery': ${snap2.size}`);
    snap2.docs.forEach((d) => {
      console.log(`Doc ID: [${d.id}] ->`, JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error("Error inspecting gallery:", err.message);
  }

  // 2. Internships Collection
  console.log("\n--- Checking 'internships' Collection (Root) ---");
  try {
    const snap3 = await getDocs(collection(db, "internships"));
    console.log(`Count in 'internships' root: ${snap3.size}`);
    snap3.docs.forEach((d) => {
      console.log(`Doc ID: [${d.id}] ->`, JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error("Error inspecting internships root:", err.message);
  }

  console.log("\n--- Checking 'internships/internshipdetail/programs' Subcollection ---");
  try {
    const snap4 = await getDocs(collection(db, "internships", "internshipdetail", "programs"));
    console.log(`Count in 'internships/internshipdetail/programs': ${snap4.size}`);
    snap4.docs.forEach((d) => {
      console.log(`Doc ID: [${d.id}] ->`, JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error("Error inspecting internships subcollection:", err.message);
  }

  console.log("\n--- Checking 'internships/internshipSlider/slides' Subcollection ---");
  try {
    const snap5 = await getDocs(collection(db, "internships", "internshipSlider", "slides"));
    console.log(`Count in 'internships/internshipSlider/slides': ${snap5.size}`);
    snap5.docs.forEach((d) => {
      console.log(`Doc ID: [${d.id}] ->`, JSON.stringify(d.data(), null, 2));
    });
  } catch (err) {
    console.error("Error inspecting slider subcollection:", err.message);
  }

  process.exit(0);
}

inspect();
