const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, updateDoc, doc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB4lmcc8MHELvpSMi6owhmicwrPVGEXezg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "haji-murad.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "haji-murad",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "haji-murad.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1067564434876",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1067564434876:web:822059421b4952368317b9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PREFERRED_ORDER = [
  "abdul rauf",
  "arslan shahid",
  "zafar iqbal",
  "sonia hameed",
  "palwasha",
  "rabia mustafa",
  "usman ali khan",
];

async function updateDoctorsOrder() {
  try {
    console.log("Fetching doctors collection from Firestore...");
    const snapshot = await getDocs(collection(db, "doctors"));
    console.log(`Found ${snapshot.docs.length} doctor documents.`);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const nameLower = (data.name || "").toLowerCase();
      let foundIndex = -1;

      for (let i = 0; i < PREFERRED_ORDER.length; i++) {
        if (nameLower.includes(PREFERRED_ORDER[i])) {
          foundIndex = i + 1; // 1-indexed (1 to 7)
          break;
        }
      }

      if (foundIndex !== -1) {
        console.log(`Setting order = ${foundIndex} for "${data.name}" (${docSnap.id})`);
        await updateDoc(doc(db, "doctors", docSnap.id), {
          order: foundIndex,
        });
      } else {
        console.log(`Skipping index for "${data.name}" (${docSnap.id}) - setting default order 100`);
        await updateDoc(doc(db, "doctors", docSnap.id), {
          order: 100,
        });
      }
    }

    console.log("All doctors updated with official sequence order!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating doctors order:", err);
    process.exit(1);
  }
}

updateDoctorsOrder();
