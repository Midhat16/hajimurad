"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TechnologyForm from "@/components/admin/TechnologyForm";

export default function NewTechnologyPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "technologies"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      router.push("/admin/technologies");
    } catch (err) {
      console.error("Failed to add technology:", err);
      alert("Error adding technology platform. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TechnologyForm
      title="Add New Technology"
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
