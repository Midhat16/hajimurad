"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import PdfPicker from "@/components/admin/PdfPicker";

export default function AdminNewNewsletterPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [order, setOrder] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!date.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "newsletters"), {
        title: date.trim(),
        date: date.trim() || "Latest Bulletin",
        description: "",
        fileUrl: fileUrl.trim(),
        order: Number(order) || 1,
        createdAt: serverTimestamp(),
      });

      router.push("/admin/media/newsletters");
    } catch (err) {
      console.error("Error creating newsletter:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        setError("Firebase Permission Error: Please update Firestore Security Rules to allow write access to 'newsletters' collection.");
      } else {
        setError(err?.message || "Failed to save newsletter.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Create Bulletin
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Add New Newsletter
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Enter publication date/period and upload PDF document from PC or paste cloud link.
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
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">
                Publication Date / Period *
              </label>
              <input
                type="text"
                required
                placeholder="Publication period"
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
              {isSubmitting ? "Saving Newsletter..." : "Save Newsletter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
