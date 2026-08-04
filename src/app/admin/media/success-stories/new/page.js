"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ImagePicker from "@/components/admin/ImagePicker";
import { ArrowLeft, Save, HeartHandshake, AlertCircle } from "lucide-react";

export default function AdminNewSuccessStoryPage() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [order, setOrder] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !story.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "successStories"), {
        patientName: patientName.trim() || "Patient",
        title: title.trim(),
        story: story.trim(),
        imageUrl: imageUrl.trim(),
        order: Number(order) || 1,
        createdAt: serverTimestamp(),
      });

      router.push("/admin/media/success-stories");
    } catch (err) {
      console.error("Error creating story:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        setError("Firebase Permission Error: Please update Firestore Security Rules to allow write access to 'successStories' collection.");
      } else {
        setError(err?.message || "Failed to save success story.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/media/success-stories"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--ink)] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Success Stories
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Create Testimonial
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Add New Patient Success Story
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Fill in patient name, story title, recovery testimonial, and optional photo.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold space-y-1">
            <p className="font-extrabold text-sm text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 inline" /> Firebase Security Rule Notice
            </p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Patient full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                Display Order Position
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>
          </div>

          {/* Story Title */}
          <div>
            <label className="text-xs font-bold text-[var(--ink)] block mb-1">
              Story Headline Title *
            </label>
            <input
              type="text"
              required
              placeholder="Story headline title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
            />
          </div>

          {/* Patient Photo (Optional) */}
          <ImagePicker
            label="Select Patient Photograph"
            value={imageUrl}
            onChange={setImageUrl}
          />

          {/* Story Body */}
          <div>
            <label className="text-xs font-bold text-[var(--ink)] block mb-1">
              Full Patient Testimonial Story *
            </label>
            <textarea
              required
              rows={6}
              placeholder="Enter full recovery experience and patient feedback..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-y leading-relaxed"
            />
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving Story..." : "Save Success Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
