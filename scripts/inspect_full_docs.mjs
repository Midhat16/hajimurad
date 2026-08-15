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

async function inspectFullDocs() {
  console.log("================ INSPECTING FULL FIRESTORE DATA ================");

  // 1. Check internships/details
  const dSnap = await getDoc(doc(db, "internships", "details"));
  if (dSnap.exists()) {
    console.log("\n--- internships/details ---");
    console.log(JSON.stringify(dSnap.data(), null, 2));
  } else {
    console.log("\n--- internships/details DOES NOT EXIST ---");
  }

  // 2. Check internships root collection for any individual docs
  const rSnap = await getDocs(collection(db, "internships"));
  console.log(`\n--- internships root collection docs (${rSnap.size}): ---`);
  rSnap.docs.forEach((d) => {
    console.log(`Doc ID: [${d.id}] keys:`, Object.keys(d.data()));
    if (d.id !== "details" && d.id !== "imageSlider") {
      console.log(`Individual doc [${d.id}] content:`, JSON.stringify(d.data(), null, 2));
    }
  });

  // 3. Check galleryImages collection
  const gSnap = await getDocs(collection(db, "galleryImages"));
  console.log(`\n--- galleryImages collection docs (${gSnap.size}): ---`);
  gSnap.docs.forEach((d) => {
    console.log(`Doc ID: [${d.id}] categoryName:`, d.data().categoryName, "images count:", (d.data().images || []).length);
    if (d.data().imageUrl || d.data().url) {
      console.log(`Flat photo doc [${d.id}]:`, JSON.stringify(d.data(), null, 2));
    }
  });

  process.exit(0);
}

inspectFullDocs();
