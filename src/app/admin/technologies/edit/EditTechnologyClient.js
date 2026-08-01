"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TechnologyForm from "@/components/admin/TechnologyForm";

export default function EditTechnologyClient() {
  const searchParams = useSearchParams();
  const techId = searchParams?.get("id");
  const router = useRouter();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchTech() {
      if (!techId) return;
      try {
        const docSnap = await getDoc(doc(db, "technologies", techId));
        if (docSnap.exists()) {
          setInitialData({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("Technology item not found.");
          router.push("/admin/technologies");
        }
      } catch (err) {
        console.error("Error fetching technology:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTech();
  }, [techId, router]);

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "technologies", techId), formData);
      router.push("/admin/technologies");
    } catch (err) {
      console.error("Failed to update technology:", err);
      alert("Error updating equipment specs. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#0B3D5C]">Loading Equipment Details...</p>
      </div>
    );
  }

  return (
    <TechnologyForm
      title={`Edit Technology — ${initialData?.name || ""}`}
      initialData={initialData}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
