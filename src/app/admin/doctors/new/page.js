"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DoctorForm from "@/components/admin/DoctorForm";

export default function NewDoctorPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const { loginEmail, loginPassword, ...publicData } = formData;

      // 1. Add public doctor document to "doctors" collection
      const docRef = await addDoc(collection(db, "doctors"), {
        ...publicData,
        createdAt: serverTimestamp(),
      });

      // 2. Save credentials in "doctorCredentials" collection with fallback
      if (loginEmail && loginPassword) {
        try {
          await setDoc(doc(db, "doctorCredentials", docRef.id), {
            email: loginEmail.trim().toLowerCase(),
            password: loginPassword.trim(),
            doctorId: docRef.id,
            createdAt: serverTimestamp(),
          });
        } catch (credErr) {
          console.warn("doctorCredentials write permission notice, applying fallback:", credErr);
          try {
            await setDoc(
              doc(db, "doctors", docRef.id),
              {
                loginEmail: loginEmail.trim().toLowerCase(),
                loginPassword: loginPassword.trim(),
              },
              { merge: true }
            );
          } catch (fbErr) {
            console.warn("Fallback credentials write notice:", fbErr);
          }
        }
      }

      router.push("/admin/doctors");
    } catch (err) {
      console.error("Failed to add doctor to Firestore:", err);
      alert("Error adding doctor profile: " + (err.message || "Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DoctorForm
      title="Add New Doctor"
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
