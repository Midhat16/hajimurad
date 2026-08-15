"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ImagePicker from "@/components/admin/ImagePicker";
import VideoPicker from "@/components/admin/VideoPicker";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";

function EditSuccessStoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [patientName, setPatientName] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [order, setOrder] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      router.push("/admin/media/success-stories");
      return;
    }

    async function fetchStory() {
      try {
        const snap = await getDoc(doc(db, "successStories", id));
        if (snap.exists()) {
          const data = snap.data();
          setPatientName(data.patientName || "");
          setTitle(data.title || "");
          setStory(data.story || "");
          setImageUrl(data.imageUrl || "");
          setVideoUrl(data.videoUrl || data.videoLink || "");
          setOrder(data.order || 1);
        } else {
          setError("Success Story document not found.");
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Failed to fetch story details.");
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, [id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !story.trim() || !id) return;

    setIsSubmitting(true);
    try {
      let finalVideoUrl = videoUrl.trim();
      let finalImageUrl = imageUrl.trim();

      // Ensure no raw Base64 data URLs are saved to Firestore to prevent document size limit errors
      if (finalVideoUrl.startsWith("data:")) {
        finalVideoUrl = await uploadMediaToCloudinary(finalVideoUrl, "video");
      }
      if (finalImageUrl.startsWith("data:")) {
        finalImageUrl = await uploadMediaToCloudinary(finalImageUrl, "image");
      }

      await updateDoc(doc(db, "successStories", id), {
        patientName: patientName.trim() || "Patient",
        title: title.trim(),
        story: story.trim(),
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        order: Number(order) || 1,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/media/success-stories");
    } catch (err) {
      console.error("Error updating story:", err);
      setError("Failed to update success story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading Story Details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/media/success-stories"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#2B1F1A] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Success Stories
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Edit Testimonial
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Edit Success Story
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Update patient name, headline title, testimonial text, and photo.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Display Order */}
            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
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
            <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
              Story Headline Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
            />
          </div>

          {/* Patient Photo */}
          <ImagePicker
            label="Select Patient Photograph (Optional)"
            value={imageUrl}
            onChange={setImageUrl}
          />

          {/* Patient Video (Optional - File or Link) */}
          <VideoPicker
            label="Select / Upload Patient Video OR Paste Video Link (Optional)"
            value={videoUrl}
            onChange={setVideoUrl}
          />

          {/* Story Body */}
          <div>
            <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
              Full Patient Testimonial Story *
            </label>
            <textarea
              required
              rows={6}
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
              {isSubmitting ? "Updating Story..." : "Update Success Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEditSuccessStoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A] font-sans">Loading Page...</p>
        </div>
      }
    >
      <EditSuccessStoryForm />
    </Suspense>
  );
}
