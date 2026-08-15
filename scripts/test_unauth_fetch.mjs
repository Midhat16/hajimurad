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

async function testUnauth() {
  console.log("================ TESTING UNAUTHENTICATED FIRESTORE READS ================");

  // 1. Unauth read galleryImages
  try {
    const snap1 = await getDocs(collection(db, "galleryImages"));
    console.log(`galleryImages unauth read success! Doc count: ${snap1.size}`);
    snap1.docs.forEach((d) => {
      console.log(`- Doc [${d.id}]: images count = ${(d.data().images || []).length}`);
    });
  } catch (e) {
    console.error("galleryImages unauth read FAILED:", e.message);
  }

  // 2. Unauth read internships/details
  try {
    const snap2 = await getDoc(doc(db, "internships", "details"));
    console.log(`internships/details unauth read success! Exists: ${snap2.exists()}`);
    if (snap2.exists()) {
      console.log(`- programs count = ${(snap2.data().programs || []).length}`);
    }
  } catch (e) {
    console.error("internships/details unauth read FAILED:", e.message);
  }

  // 3. Unauth read internships/imageSlider
  try {
    const snap3 = await getDoc(doc(db, "internships", "imageSlider"));
    console.log(`internships/imageSlider unauth read success! Exists: ${snap3.exists()}`);
    if (snap3.exists()) {
      console.log(`- slides count = ${(snap3.data().slides || []).length}`);
    }
  } catch (e) {
    console.error("internships/imageSlider unauth read FAILED:", e.message);
  }

  // 4. Unauth read root internships collection
  try {
    const snap4 = await getDocs(collection(db, "internships"));
    console.log(`internships root collection unauth read success! Count: ${snap4.size}`);
  } catch (e) {
    console.error("internships root collection unauth read FAILED:", e.message);
  }

  process.exit(0);
}

testUnauth();
