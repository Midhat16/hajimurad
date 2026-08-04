"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorForm from "@/components/admin/DoctorForm";

export default function EditDoctorClient() {
  const searchParams = useSearchParams();
  const doctorId = searchParams?.get("id");
  const router = useRouter();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDoctor() {
      if (!doctorId) return;
      try {
        const docSnap = await getDoc(doc(db, "doctors", doctorId));
        if (docSnap.exists()) {
          const docData = { id: docSnap.id, ...docSnap.data() };
          
          // Fetch credentials from doctorCredentials collection with fallback
          try {
            const credSnap = await getDoc(doc(db, "doctorCredentials", doctorId));
            if (credSnap.exists()) {
              const cData = credSnap.data();
              docData.loginEmail = cData.email || cData.loginEmail || docData.loginEmail || docData.email || "";
              docData.loginPassword = cData.password || cData.loginPassword || docData.loginPassword || docData.password || "";
            } else {
              docData.loginEmail = docData.loginEmail || docData.email || "";
              docData.loginPassword = docData.loginPassword || docData.password || "";
            }
          } catch (credErr) {
            console.warn("Could not fetch doctorCredentials:", credErr);
            docData.loginEmail = docData.loginEmail || docData.email || "";
            docData.loginPassword = docData.loginPassword || docData.password || "";
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
    fetchDoctor();
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
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--ink)]">Loading Doctor Profile...</p>
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
