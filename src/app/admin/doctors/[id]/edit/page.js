"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorForm from "@/components/admin/DoctorForm";

export default function EditDoctorPage({ params }) {
  const resolvedParams = use(params);
  const doctorId = resolvedParams.id;
  const router = useRouter();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        if (docSnap.exists()) {
          const docData = { id: docSnap.id, ...docSnap.data() };
          
          // Fetch credentials from doctorCredentials collection
          try {
            const credSnap = await getDoc(doc(db, "doctorCredentials", doctorId));
            if (credSnap.exists()) {
              docData.loginEmail = credSnap.data().email || "";
              docData.loginPassword = credSnap.data().password || "";
            }
          } catch (credErr) {
            console.warn("Could not fetch doctorCredentials:", credErr);
          }

          setInitialData(docData);
        } else {
          alert("Doctor record not found.");
          router.push("/admin/doctors");
        }
      } catch (err) {
        console.error("Error fetching doctor:", err);
      } finally {
        setLoading(false);
      }
    }
    if (doctorId) fetchDoctor();
  }, [doctorId, router]);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const { loginEmail, loginPassword, ...publicData } = formData;

      // 1. Update public doctor document
      await updateDoc(doc(db, "doctors", doctorId), publicData);

      // 2. Update credentials document with fallback
      if (loginEmail || loginPassword) {
        try {
          await setDoc(
            doc(db, "doctorCredentials", doctorId),
            {
              email: (loginEmail || "").trim().toLowerCase(),
              password: (loginPassword || "").trim(),
              doctorId: doctorId,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (credErr) {
          console.warn("doctorCredentials merge notice, applying fallback:", credErr);
          try {
            await setDoc(
              doc(db, "doctors", doctorId),
              {
                loginEmail: (loginEmail || "").trim().toLowerCase(),
                loginPassword: (loginPassword || "").trim(),
              },
              { merge: true }
            );
          } catch (fbErr) {
            console.warn("Fallback update error notice:", fbErr);
          }
        }
      }

      router.push("/admin/doctors");
    } catch (err) {
      console.error("Failed to update doctor profile:", err);
      alert("Error updating doctor profile: " + (err.message || "Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#0B3D5C]">Loading Doctor Profile...</p>
      </div>
    );
  }

  return (
    <DoctorForm
      title={`Edit Doctor — ${initialData?.name || ""}`}
      initialData={initialData}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
