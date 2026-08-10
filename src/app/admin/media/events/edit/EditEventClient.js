"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EventForm from "@/components/admin/EventForm";

export default function EditEventClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No Event ID provided.");
      setLoading(false);
      return;
    }

    async function fetchEvent() {
      try {
        const snap = await getDoc(doc(db, "events", id));
        if (snap.exists()) {
          setEventData({ id: snap.id, ...snap.data() });
        } else {
          setError("Event not found.");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event data.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading Event Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white rounded-3xl p-8 border border-rose-200">
        <p className="text-sm font-bold text-rose-600 mb-4">{error}</p>
        <a href="/admin/media/events" className="text-xs font-bold text-[var(--ink)] underline">
          Back to Events List
        </a>
      </div>
    );
  }

  return <EventForm initialData={eventData} isEdit={true} />;
}
