"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, "services"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      router.push("/admin/services");
    } catch (err) {
      console.error("Failed to add service:", err);
      alert("Error adding service card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ServiceForm
      title="Add New Service"
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
