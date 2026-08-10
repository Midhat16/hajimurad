const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc } = require("firebase/firestore");

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

async function updateAboutAllahText() {
  try {
    const aboutRef = doc(db, "siteContent", "about");
    const snap = await getDoc(aboutRef);
    if (snap.exists()) {
      const data = snap.data();
      let updatedStory = data.story || "";
      if (updatedStory.includes("Allah Almighty ,")) {
        updatedStory = updatedStory.replace(/Allah Almighty\s+,/g, "Allah Almighty,");
        await setDoc(aboutRef, { ...data, story: updatedStory }, { merge: true });
        console.log("Cleaned up 'Allah Almighty ,' to 'Allah Almighty,' in Firestore!");
      } else if (updatedStory.includes("Almighty Allah")) {
        updatedStory = updatedStory.replace(/Almighty Allah/g, "Allah Almighty");
        await setDoc(aboutRef, { ...data, story: updatedStory }, { merge: true });
        console.log("Successfully updated 'Almighty Allah' to 'Allah Almighty' in Firestore siteContent/about!");
      } else {
        console.log("Current story content in Firestore:", data.story);
      }
    } else {
      console.log("No siteContent/about document found in Firestore.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error updating about text:", err);
    process.exit(1);
  }
}

updateAboutAllahText();
