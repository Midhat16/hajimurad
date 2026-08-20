"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, GraduationCap, AlertCircle, Plus, Trash2, Sparkles, Quote } from "lucide-react";
import ImagePicker from "@/components/admin/ImagePicker";
import MultiImagePicker from "@/components/admin/MultiImagePicker";

function EditInternshipFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    { title: "Hands-on Clinical Training", description: "Direct exposure to advanced ophthalmic procedures and diagnostics." },
  ]);

  const [quotes, setQuotes] = useState([
    { title: "100% FREE Internship Program" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No internship ID provided.");
      setLoading(false);
      return;
    }

    async function fetchProgram() {
      try {
        let programData = null;

        // 1. Try target doc 1 'internships/details' (programs array)
        try {
          const detailsRef = doc(db, "internships", "details");
          const detailsSnap = await getDoc(detailsRef);
          if (detailsSnap.exists()) {
            const data = detailsSnap.data();
            const progs = Array.isArray(data.programs) ? data.programs : [];
            const match = progs.find((p) => p.id === id);
            if (match) {
              programData = match;
            }
          }
        } catch (e0) {
          console.warn("Notice fetching details doc:", e0);
        }

        // 2. Try root collection doc (if not found in details)
        if (!programData) {
          try {
            const rootRef = doc(db, "internships", id);
            const snap = await getDoc(rootRef);
            if (snap.exists() && snap.id !== "details" && snap.id !== "imageSlider") {
              programData = { id: snap.id, ...snap.data() };
            }
          } catch (e1) {
            console.warn("Root fetch notice:", e1);
          }
        }

        // 3. Try subcollection path
        if (!programData) {
          try {
            const subRef = doc(db, "internships", "internshipdetail", "programs", id);
            const subSnap = await getDoc(subRef);
            if (subSnap.exists()) {
              programData = { id: subSnap.id, ...subSnap.data() };
            }
          } catch (e2) {
            console.warn("Subcollection fetch notice:", e2);
          }
        }

        if (programData) {
          const data = programData;
          setTitle(data.title || "");

          const knownDepts = ["Ophthalmology", "Optometry", "Nursing", "Administration"];
          if (knownDepts.includes(data.department)) {
            setDepartment(data.department);
          } else {
            setDepartment("Other");
            setCustomDept(data.department || "");
          }

          setDuration(data.duration || "3 Months");
          setTiming(data.timing || "08:00 AM - 02:00 PM");
          setOrder(data.order || 1);
          setIsActive(data.isActive !== false);
          setDescription(data.description || "");
          setRequirements(data.requirements || "");
          setVideoUrl(data.videoUrl || data.videoLink || "");

          const rawGallery = Array.isArray(data.galleryImages) ? data.galleryImages : [];
          const normalizedGallery = rawGallery
            .map((img) => {
              if (typeof img === "string") {
                return img.trim() ? { url: img.trim(), caption: "" } : null;
              }
              if (img && typeof img === "object") {
                const url = (img.url || img.imageUrl || "").trim();
                const caption = (img.caption || "").trim();
                return url ? { url, caption } : null;
              }
              return null;
            })
            .filter(Boolean);
          setGalleryImages(normalizedGallery);

          if (Array.isArray(data.highlights) && data.highlights.length > 0) {
            setHighlights(
              data.highlights.map((h) => ({
                title: h.title || "",
                description: h.description || "",
              }))
            );
          } else {
            setHighlights([
              { title: "Hands-on Clinical Training", description: "Direct exposure to advanced ophthalmic procedures and diagnostics." },
            ]);
          }

          if (Array.isArray(data.quotes) && data.quotes.length > 0) {
            setQuotes(
              data.quotes.map((q) => ({
                title: q.title || "",
              }))
            );
          }
        } else {
          setError("Internship program not found.");
        }
      } catch (err) {
        console.warn("Error loading internship:", err);
        setError("Failed to load program details.");
      } finally {
        setLoading(false);
      }
    }

    fetchProgram();
  }, [id]);

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
    if (!title.trim() || !id) return;

    setIsSubmitting(true);
    setError("");

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

      const updatePayload = {
        id: id,
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
        updatedAt: new Date().toISOString(),
      };

      const detailsRef = doc(db, "internships", "details");
      const detailsSnap = await getDoc(detailsRef);
      if (detailsSnap.exists()) {
        const currentProgs = Array.isArray(detailsSnap.data().programs) ? [...detailsSnap.data().programs] : [];
        const updatedProgs = currentProgs.map((p) => (p.id === id ? { ...p, ...updatePayload } : p));
        await setDoc(detailsRef, { programs: updatedProgs, updatedAt: serverTimestamp() });
      } else {
        await setDoc(detailsRef, { programs: [updatePayload], updatedAt: serverTimestamp() });
      }

      try {
        await setDoc(doc(db, "internships", id), updatePayload, { merge: true });
      } catch (rootErr) {
        console.warn("Notice updating root doc:", rootErr);
      }

      router.push("/admin/internships");
    } catch (err) {
      console.error("Error updating internship:", err);
      const errMsg = err?.message || err?.code || String(err);
      setError(`Failed to update internship: ${errMsg}`);
      alert(`Failed to update internship program: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-3">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-[#2B1F1A] uppercase">Loading Program Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-[var(--line)] text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-[#2B1F1A]">Error Loading Editor</h2>
          <p className="text-xs text-[var(--slate)] font-semibold">{error}</p>
          <Link
            href="/admin/internships"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Internships
          </Link>
        </div>
      </div>
    );
  }

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
            Program Editor
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Edit Internship Program
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Update program specs, department classification, highlights, and requirements.
          </p>
        </div>

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Department */}
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

            {/* Custom Dept */}
            {department === "Other" && (
              <div>
                <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Custom Department Name</label>
                <input
                  type="text"
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                />
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Timing Option (Replaces static location) */}
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

            {/* Sort Order */}
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

            {/* Status Toggle */}
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[var(--iris)] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-[#2B1F1A] cursor-pointer">
                Publicly Active & Open For Applications
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
              Program Description & Responsibilities
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
            />
          </div>





          {/* Program Highlights (Repeatable with Title, Description & Icon) */}
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

          {/* Program Quotes & Key Features Portion (Repeatable) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#2B1F1A] flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[var(--iris)]" /> Program Guarantees & Features Portion
                </h3>
                <p className="text-[11px] font-medium text-[var(--slate)]">
                  Add quote boxes / feature notes (icons are assigned automatically).
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
              <span>{isSubmitting ? "Updating..." : "Update Internship Program"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEditInternshipPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] max-w-xl mx-auto shadow-sm">
          <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A] uppercase">Loading Editor...</p>
        </div>
      }
    >
      <EditInternshipFormContent />
    </Suspense>
  );
}
