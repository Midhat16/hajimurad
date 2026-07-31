"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ServiceForm from "@/components/admin/ServiceForm";

export default function EditServicePage({ params }) {
  const resolvedParams = use(params);
  const serviceId = resolvedParams.id;
  const router = useRouter();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchService() {
      try {
        const docSnap = await getDoc(doc(db, "services", serviceId));
        if (docSnap.exists()) {
          setInitialData({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Service item not found.");
          router.push("/admin/services");
        }
      } catch (err) {
        console.error("Error fetching service:", err);
      } finally {
        setLoading(false);
      }
    }
    if (serviceId) fetchService();
  }, [serviceId, router]);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "services", serviceId), formData);
      router.push("/admin/services");
    } catch (err) {
      console.error("Failed to update service:", err);
      alert("Error updating service details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#0B3D5C]">Loading Service Details...</p>
      </div>
    );
  }

  return (
    <ServiceForm
      title={`Edit Service — ${initialData?.title || ""}`}
      initialData={initialData}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
