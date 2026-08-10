"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      // Find current max order from existing services
      let maxOrder = 0;
      try {
        const snap = await getDocs(collection(db, "services"));
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.order === "number" && data.order > maxOrder) {
            maxOrder = data.order;
          }
        });
        if (maxOrder === 0 && !snap.empty) {
          maxOrder = snap.docs.length;
        }
      } catch (e) {
        console.warn("Could not calculate max order:", e);
      }

      const nextOrder = maxOrder > 0 ? maxOrder + 1 : 1;

      await addDoc(collection(db, "services"), {
        ...formData,
        order: nextOrder,
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
