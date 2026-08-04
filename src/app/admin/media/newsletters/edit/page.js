"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import PdfPicker from "@/components/admin/PdfPicker";

function EditNewsletterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [date, setDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [order, setOrder] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      router.push("/admin/media/newsletters");
      return;
    }

    async function fetchNewsletter() {
      try {
        const snap = await getDoc(doc(db, "newsletters", id));
        if (snap.exists()) {
          const data = snap.data();
          setDate(data.date || data.title || "");
          setFileUrl(data.fileUrl || "");
          setOrder(data.order || 1);
        } else {
          setError("Newsletter document not found.");
        }
      } catch (err) {
        console.error("Error fetching newsletter:", err);
        setError("Failed to fetch newsletter details.");
      } finally {
        setLoading(false);
      }
    }

    fetchNewsletter();
  }, [id, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!date.trim() || !id) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "newsletters", id), {
        title: date.trim(),
        date: date.trim() || "Latest Bulletin",
        description: "",
        fileUrl: fileUrl.trim(),
        order: Number(order) || 1,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/media/newsletters");
    } catch (err) {
      console.error("Error updating newsletter:", err);
      setError("Failed to update newsletter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--ink)]">Loading Newsletter Details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/media/newsletters"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--ink)] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Newsletters
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Edit Bulletin
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Edit Newsletter
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Update publication date/period and PDF link.
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
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                Publication Date / Period *
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Order */}
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

          {/* PDF File Picker */}
          <PdfPicker
            label="Newsletter Document (Upload PDF from PC OR Paste Link) *"
            value={fileUrl}
            onChange={setFileUrl}
            required
          />

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Updating Newsletter..." : "Update Newsletter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEditNewsletterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[var(--ink)] font-sans">Loading Page...</p>
        </div>
      }
    >
      <EditNewsletterForm />
    </Suspense>
  );
}
