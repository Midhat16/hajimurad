"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, GraduationCap, Building2, Clock, Users, FileText, CheckCircle2, Plus, Trash2, Sparkles, AlertCircle, Quote } from "lucide-react";
import ImagePicker from "@/components/admin/ImagePicker";
import MultiImagePicker from "@/components/admin/MultiImagePicker";

export default function AdminNewInternshipPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Ophthalmology");
  const [customDept, setCustomDept] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [timing, setTiming] = useState("08:00 AM - 02:00 PM");
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);

  const [highlights, setHighlights] = useState([
    { title: "Refraction", description: "A balanced programme combining theory, practical training, patient exposure, and regular evaluation." },
    { title: "Retinoscopy", description: "" },
  ]);

  const [quotes, setQuotes] = useState([
    { title: "100% FREE Internship Program" },
    { title: "Structured Practical Exposure" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddHighlight = () => {
    setHighlights((prev) => [...prev, { title: "", description: "" }]);
  };

  const handleRemoveHighlight = (index) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHighlightChange = (index, field, value) => {
    setHighlights((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddQuote = () => {
    setQuotes((prev) => [...prev, { title: "" }]);
  };

  const handleRemoveQuote = (index) => {
    setQuotes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuoteChange = (index, field, value) => {
    setQuotes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const finalDept = department === "Other" ? customDept.trim() || "General" : department;

      const formattedHighlights = highlights
        .filter((h) => (h.title && h.title.trim()) || (h.description && h.description.trim()))
        .map((h) => ({
          title: (h.title || "").trim(),
          description: (h.description || "").trim(),
        }));

      const formattedQuotes = quotes
        .filter((q) => q.title && q.title.trim())
        .map((q) => ({
          title: q.title.trim(),
        }));

      const formattedGallery = galleryImages
        .map((img) => {
          if (typeof img === "string") {
            const url = img.trim();
            return url ? { url, caption: "" } : null;
          }
          if (img && typeof img === "object") {
            const url = (img.url || img.imageUrl || "").trim();
            const caption = (img.caption || "").trim();
            return url ? { url, caption } : null;
          }
          return null;
        })
        .filter(Boolean);

      const newProgramPayload = {
        title: title.trim(),
        department: finalDept,
        duration: duration.trim() || "3 Months",
        timing: timing.trim() || "08:00 AM - 02:00 PM",
        order: Number(order) || 1,
        isActive: isActive,
        description: description.trim(),
        requirements: requirements.trim(),
        videoUrl: videoUrl.trim(),
        galleryImages: formattedGallery,
        highlights: formattedHighlights,
        quotes: formattedQuotes,
      };

      const newProgramObj = {
        id: Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7),
        ...newProgramPayload,
        createdAt: new Date().toISOString(),
      };

      const detailsRef = doc(db, "internships", "details");
      const detailsSnap = await getDoc(detailsRef);
      const currentProgs = detailsSnap.exists() && Array.isArray(detailsSnap.data().programs) ? [...detailsSnap.data().programs] : [];
      currentProgs.push(newProgramObj);
      await setDoc(detailsRef, { programs: currentProgs, updatedAt: serverTimestamp() });

      router.push("/admin/internships");
    } catch (err) {
      console.error("Error creating internship:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        setError("Firebase Permission Error: Please update Firestore Rules in Firebase Console to allow write access to 'internships' collection.");
      } else {
        setError(err?.message || "Failed to create internship program.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/internships"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#2B1F1A] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Internships
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Create Program
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Add New Internship Program
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Fill in program details, department classification, highlights, and requirements.
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
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                Program Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder=""
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              >
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Optometry">Optometry</option>
                <option value="Nursing">Nursing</option>
                <option value="Administration">Administration</option>
                <option value="Other">Other / Custom</option>
              </select>
            </div>

            {department === "Other" && (
              <div>
                <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Custom Department Name</label>
                <input
                  type="text"
                  placeholder=""
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Duration</label>
              <input
                type="text"
                placeholder=""
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                Program Timing
              </label>
              <input
                type="text"
                placeholder=""
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Display Priority Order</label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="text-xs font-bold text-[#2B1F1A]">Active Status</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 ${isActive ? "bg-[var(--iris)]" : "bg-slate-300"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
              Program Description & Overview <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe program details, goals, and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <MultiImagePicker
              values={galleryImages}
              onChange={(newGallery) => setGalleryImages(newGallery)}
              showCaptions={true}
              label="Program & Practical Training Media Gallery (Upload Multiple Images with Captions)"
            />
          </div>



          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2B1F1A] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--iris)]" /> Program Key Highlights
                </h3>
                <p className="text-[11px] font-medium text-[var(--slate)]">
                  Add highlight modules with title, optional description, and image icon.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddHighlight}
                className="inline-flex items-center gap-1 bg-[var(--fog)] hover:bg-[var(--line)]/30 text-[var(--ink)] text-xs font-bold px-3 py-1.5 rounded-xl border border-[var(--line)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Highlight
              </button>
            </div>

            <div className="space-y-3">
              {highlights.map((h, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--iris)] bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                      Highlight #{idx + 1}
                    </span>
                    {highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove highlight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#2B1F1A] block mb-1">Highlight Title *</label>
                      <input
                        type="text"
                        placeholder=""
                        value={h.title}
                        onChange={(e) => handleHighlightChange(idx, "title", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#2B1F1A] block mb-1">Highlight Description (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder=""
                        value={h.description || ""}
                        onChange={(e) => handleHighlightChange(idx, "description", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2B1F1A] flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[var(--iris)]" /> Program Guarantees & Features Portion
                </h3>
                <p className="text-[11px] font-medium text-[var(--slate)]">
                  Add feature notes / quote boxes (icons are assigned automatically).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuote}
                className="inline-flex items-center gap-1 bg-[var(--fog)] hover:bg-[var(--line)]/30 text-[var(--ink)] text-xs font-bold px-3 py-1.5 rounded-xl border border-[var(--line)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Quote Box
              </button>
            </div>

            <div className="space-y-3">
              {quotes.map((q, idx) => (
                <div key={idx} className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-white px-2.5 py-0.5 rounded-md border border-blue-200">
                      Quote Box #{idx + 1}
                    </span>
                    {quotes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuote(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#2B1F1A] block mb-1">Quote Box Title / Headline *</label>
                      <input
                        type="text"
                        placeholder=""
                        value={q.title}
                        onChange={(e) => handleQuoteChange(idx, "title", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
              Eligibility & Skill Requirements
            </label>
            <textarea
              rows={4}
              placeholder="Enter eligibility criteria and required qualifications..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/admin/internships"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : "Save Internship Program"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
