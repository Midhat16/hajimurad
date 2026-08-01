// scripts/seed.js
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBddqZTI18_qrWjaM4r98GVuJvr9om3xBA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "haji-murad-eye-hospital.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "haji-murad-eye-hospital",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "haji-murad-eye-hospital.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "694076028239",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:694076028239:web:cb6821281f0cb0607e013a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SERVICES_DATA = [
  {
    id: "service-1",
    title: "Wavefront LASIK & Refractive",
    description: "Correction for myopia, hyperopia, and astigmatism using advanced 3D wavefront mapping and blade-free cool-beam excimer lasers.",
    icon: "Sparkles",
    color: "from-sky-400 to-blue-500",
    features: ["Blade-free procedure", "10-minute surgery", "Rapid 24h recovery"]
  },
  {
    id: "service-2",
    title: "Micro-Incision Cataract Surgery",
    description: "Gentle ultrasound removal of cloudy lenses, replaced with premium multifocal, toric, or trifocal intraocular implants (IOLs) for reading and distance.",
    icon: "Sun",
    color: "from-amber-400 to-orange-500",
    features: ["No-stitch, no-patch", "Custom premium IOLs", "Outpatient procedure"]
  },
  {
    id: "service-3",
    title: "Retina & Vitreous Treatment",
    description: "State-of-the-art diagnostics and laser therapies for macular degeneration, diabetic retinopathy, retinal detachment, and floaters.",
    icon: "Eye",
    color: "from-emerald-400 to-teal-500",
    features: ["High-res OCT imaging", "Intravitreal injections", "Micro-laser therapy"]
  },
  {
    id: "service-4",
    title: "Glaucoma Care & Management",
    description: "Prevention of optic nerve damage through early pressure scanning, advanced selective laser trabeculoplasty (SLT), and micro-invasive glaucoma surgery (MIGS).",
    icon: "Activity",
    color: "from-indigo-400 to-purple-500",
    features: ["OCT nerve scans", "Selective Laser (SLT)", "MIGS micro-implants"]
  },
  {
    id: "service-5",
    title: "Pediatric & Strabismus Care",
    description: "Specialized, child-friendly environment for correcting amblyopia (lazy eye), strabismus (crossed eyes), and early pediatric vision issues.",
    icon: "Smile",
    color: "from-rose-400 to-pink-500",
    features: ["Child-friendly clinic", "Non-surgical patch care", "Muscle balancing surgery"]
  },
  {
    id: "service-6",
    title: "Cornea & Keratoconus Therapy",
    description: "Treatment for corneal dystrophies and keratoconus using collagen cross-linking (CXL), specialized scleral lenses, and modern transplants.",
    icon: "ShieldAlert",
    color: "from-violet-400 to-fuchsia-500",
    features: ["Corneal Cross-Linking", "Custom scleral lenses", "DMEK transplant options"]
  }
];

const DOCTORS_DATA = [
  {
    id: "doc-1",
    name: "Dr. Evelyn Vance",
    role: "Chief Ophthalmic Surgeon",
    specialty: "Cornea & Refractive Surgery",
    education: "MD, Johns Hopkins University",
    fellowship: "Refractive Surgery Fellow (Moorfields, London)",
    bio: "Dr. Vance is a world authority on corneal topography and blade-free LASIK. She has performed over 12,000 laser corrections.",
    metrics: "12k+ Surgeries",
    gradient: "from-sky-400 to-blue-500",
    initials: "EV",
    photoUrl: "/images/doctors/dr-evelyn-vance.jpg"
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Sterling",
    role: "Director of Retina Services",
    specialty: "Vitreoretinal Specialist",
    education: "MD, Harvard Medical School",
    fellowship: "Vitreoretinal Surgery Fellow (Mayo Clinic)",
    bio: "Dr. Sterling specializes in complex retinal attachment surgery, diabetic retinopathy, and high-precision macular repairs.",
    metrics: "9k+ Procedures",
    gradient: "from-teal-400 to-emerald-500",
    initials: "MS",
    photoUrl: "/images/doctors/dr-marcus-sterling.jpg"
  },
  {
    id: "doc-3",
    name: "Dr. Sarah Jenkins",
    role: "Head of Pediatrics",
    specialty: "Pediatric Ophthalmology & Strabismus",
    education: "MD, Stanford University",
    fellowship: "Pediatric Ophthalmology Fellow (UCSF)",
    bio: "Dr. Jenkins dedicates her practice to early childhood vision restoration and correcting complex cases of pediatric strabismus.",
    metrics: "6k+ Children Helped",
    gradient: "from-rose-400 to-pink-500",
    initials: "SJ",
    photoUrl: "/images/doctors/dr-sarah-jenkins.jpg"
  },
  {
    id: "doc-4",
    name: "Dr. Adrian Vance",
    role: "Chief Glaucoma Consultant",
    specialty: "Glaucoma Specialist",
    education: "MD, Columbia College of Surgeons",
    fellowship: "Glaucoma Fellow (Bascom Palmer Eye Institute)",
    bio: "Dr. Vance is a pioneer in Micro-Invasive Glaucoma Surgery (MIGS) and selective laser trabeculoplasty technologies.",
    metrics: "8k+ Glaucoma Cases",
    gradient: "from-violet-400 to-indigo-500",
    initials: "AV",
    photoUrl: "/images/doctors/dr-adrian-vance.jpg"
  }
];

const TESTIMONIALS_DATA = [
  {
    id: "test-1",
    name: "Aisha Rahman",
    age: 28,
    procedure: "Wavefront LASIK Surgery",
    rating: 5,
    quote: "Getting LASIK at Haji Murad was life-changing. I had extremely high nearsightedness. The actual surgery took only 10 minutes, and the doctors explained every step. The next morning, I woke up seeing 20/20. No pain, just pure clarity!",
    date: "2 months ago",
    initials: "AR"
  },
  {
    id: "test-2",
    name: "Kamran Siddiqui",
    age: 62,
    procedure: "Micro-Incision Cataract (Multifocal IOL)",
    rating: 5,
    quote: "My cataract had made driving at night impossible. The senior doctor recommended a premium multifocal lens. The procedure was completely stitchless and painless. Now, I don't even need glasses to read the newspaper! Incredible team.",
    date: "1 month ago",
    initials: "KS"
  },
  {
    id: "test-3",
    name: "Saima Tariq",
    age: 34,
    procedure: "Retinal Tear Laser Therapy",
    rating: 5,
    quote: "I noticed sudden flashes of light in my left eye and panicked. Haji Murad's emergency team scanned my eye immediately and detected a retinal tear. The specialist surgeon repaired it with a laser on the spot. They saved my sight.",
    date: "3 months ago",
    initials: "ST"
  },
  {
    id: "test-4",
    name: "Zainab Malik",
    age: 45,
    procedure: "Glaucoma SLT Laser Management",
    rating: 5,
    quote: "Glaucoma runs in my family, so I was terrified of vision loss. The early detection scanning here is incredible. They successfully stabilized my eye pressures with laser trabeculoplasty. The follow-up care is outstanding.",
    date: "5 months ago",
    initials: "ZM"
  }
];

async function seedData() {
  try {
    console.log("Seeding services collection to Firestore...");
    for (const service of SERVICES_DATA) {
      await setDoc(doc(db, "services", service.id), service);
    }
    console.log("Seeding doctors collection to Firestore...");
    for (const doctor of DOCTORS_DATA) {
      await setDoc(doc(db, "doctors", doctor.id), doctor);
    }
    console.log("Seeding testimonials collection to Firestore...");
    for (const testimonial of TESTIMONIALS_DATA) {
      await setDoc(doc(db, "testimonials", testimonial.id), testimonial);
    }
    console.log("All data successfully seeded into Cloud Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("Firestore Seeding failed:", error);
    process.exit(1);
  }
}

seedData();
