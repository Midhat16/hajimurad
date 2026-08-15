"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, ArrowLeft, CalendarDays, AlertCircle, Layers, UserCheck, CheckCircle2, Star } from "lucide-react";
import ImagePicker from "./ImagePicker";
import MultiImagePicker from "./MultiImagePicker";
import { sortDoctors } from "@/lib/doctorUtils";

const PRESET_CATEGORIES = [
  "Free Eye Camp",
  "Awareness Drive",
  "Medical Seminar",
  "Surgical Workshop",
  "Community Outreach",
];

const PRESET_STATUSES = ["Upcoming", "Past"];

export default function EventForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const initialCat = initialData?.category || "Free Eye Camp";
  const isInitialCustom = initialCat && !PRESET_CATEGORIES.includes(initialCat);

  const initialImagesList = Array.isArray(initialData?.images) && initialData.images.length > 0
    ? initialData.images
    : (initialData?.imageUrl ? [initialData.imageUrl] : []);

  const rawInitialStatus = initialData?.status === "Completed" ? "Past" : (initialData?.status || "Upcoming");
  const isInitialCustomStatus = rawInitialStatus && !PRESET_STATUSES.includes(rawInitialStatus);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    category: initialCat,
    date: initialData?.date || "",
    time: initialData?.time || "",
    location: initialData?.location || "",
    organizer: initialData?.organizer || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || initialImagesList[0] || "",
    images: initialImagesList,
    status: rawInitialStatus,
    order: initialData?.order !== undefined ? initialData.order : 1,
    assignedDoctors: initialData?.assignedDoctors || [],
    isStarred: initialData?.isStarred || false,
  });

  const [isCustomCategory, setIsCustomCategory] = useState(isInitialCustom);
  const [customCatInput, setCustomCatInput] = useState(isInitialCustom ? initialCat : "");

  const [isCustomStatus, setIsCustomStatus] = useState(isInitialCustomStatus);
  const [customStatusInput, setCustomStatusInput] = useState(isInitialCustomStatus ? rawInitialStatus : "");

  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch active hospital doctors list from Firestore
    const unsub = onSnapshot(
      collection(db, "doctors"),
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDoctorsList(sortDoctors(items));
        setLoadingDoctors(false);
      },
      (err) => {
        console.warn("Error fetching doctors in EventForm:", err);
        setLoadingDoctors(false);
      }
    );

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? Number(value) : value,
    }));
  };

  const handleCategorySelectChange = (e) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomCategory(true);
      setFormData((prev) => ({ ...prev, category: customCatInput || "" }));
    } else {
      setIsCustomCategory(false);
      setFormData((prev) => ({ ...prev, category: val }));
    }
  };

  const handleCustomCatTextChange = (e) => {
    const val = e.target.value;
    setCustomCatInput(val);
    setFormData((prev) => ({ ...prev, category: val }));
  };

  const handleStatusSelectChange = (e) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomStatus(true);
      setFormData((prev) => ({ ...prev, status: customStatusInput || "" }));
    } else {
      setIsCustomStatus(false);
      setFormData((prev) => ({ ...prev, status: val }));
    }
  };

  const handleCustomStatusTextChange = (e) => {
    const val = e.target.value;
    setCustomStatusInput(val);
    setFormData((prev) => ({ ...prev, status: val }));
  };

  const handleDoctorToggle = (docName) => {
    setFormData((prev) => {
      const currentAssigned = prev.assignedDoctors || [];
      if (currentAssigned.includes(docName)) {
        return {
          ...prev,
          assignedDoctors: currentAssigned.filter((d) => d !== docName),
        };
      } else {
        return {
          ...prev,
          assignedDoctors: [...currentAssigned, docName],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalCategory = isCustomCategory ? (customCatInput.trim() || "Event") : formData.category;

    const payload = {
      ...formData,
      category: finalCategory,
      imageUrl: formData.images?.[0] || formData.imageUrl || "",
      images: formData.images || (formData.imageUrl ? [formData.imageUrl] : []),
    };

    try {
      if (isEdit && initialData?.id) {
        await updateDoc(doc(db, "events", initialData.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "events"), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      router.push("/admin/media/events");
    } catch (err) {
      console.error("Error saving event:", err);
      setError(err.message || "Failed to save event. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/media/events"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-[#2B1F1A] tracking-tight">
              {isEdit ? "Edit Event" : "Add New Event"}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Fill in the details below to publish an upcoming hospital event or eye camp.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        {/* 1. TOP ELEMENT: MultiImagePicker for multiple event photos */}
        <div className="border-b border-slate-100 pb-6">
          <MultiImagePicker
            values={formData.images}
            onChange={(newImages) =>
              setFormData((prev) => ({
                ...prev,
                images: newImages,
                imageUrl: newImages[0] || "",
              }))
            }
            label="Event Photos / Banner Gallery (Upload Multiple Images)"
          />
        </div>

        {/* 2. Event Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
          />
        </div>

        {/* 3. Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Event Category *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) {
                    setFormData((prev) => ({ ...prev, category: customCatInput || "" }));
                  } else {
                    setFormData((prev) => ({ ...prev, category: PRESET_CATEGORIES[0] }));
                  }
                }}
                className="text-[11px] font-bold text-[var(--ink)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Layers className="w-3 h-3" />
                {isCustomCategory ? "Choose from Presets" : "+ Custom Category"}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                value={customCatInput}
                onChange={handleCustomCatTextChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleCategorySelectChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="CUSTOM">+ Create Custom Category...</option>
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Event Status *
              </label>
              {isCustomStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomStatus(false);
                    setFormData((prev) => ({ ...prev, status: "Upcoming" }));
                  }}
                  className="text-[10px] font-bold text-[var(--iris)] hover:underline cursor-pointer"
                >
                  &larr; Back to Presets
                </button>
              )}
            </div>

            {isCustomStatus ? (
              <input
                type="text"
                value={customStatusInput}
                onChange={handleCustomStatusTextChange}
                placeholder=""
                required
                className="w-full bg-white border border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-extrabold focus:outline-none focus:ring-4 transition-all"
              />
            ) : (
              <select
                name="status"
                value={formData.status}
                onChange={handleStatusSelectChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Past">Past</option>
                <option value="CUSTOM">+ Enter Custom Status...</option>
              </select>
            )}
          </div>
        </div>

        {/* 4. DOCTOR ASSIGNMENT SECTION (ADMIN CHOOSES WHICH DOCTORS BELONG TO THIS EVENT) */}
        <div className="bg-[var(--fog)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-black text-[var(--iris)] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[var(--iris)]" /> Assign Doctors / Surgeons to this Event *
              </label>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Only the assigned doctors will appear in the appointment booking dropdown for this event.
              </p>
            </div>
            <span className="text-[10px] font-bold text-[var(--iris)] bg-white px-2.5 py-1 rounded-full border border-[var(--line)]">
              {(formData.assignedDoctors || []).length} Doctor(s) Selected
            </span>
          </div>

          {loadingDoctors ? (
            <p className="text-xs font-semibold text-slate-400 py-2">Loading hospital doctors...</p>
          ) : doctorsList.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 py-2">No doctors found in database.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {doctorsList.map((docItem) => {
                const isSelected = (formData.assignedDoctors || []).includes(docItem.name);
                return (
                  <label
                    key={docItem.id || docItem.name}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white border-[var(--iris)] text-[var(--iris)] shadow-xs ring-2 ring-[var(--iris)]/20"
                        : "bg-white/70 border-[var(--line)] text-[#2B1F1A] hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleDoctorToggle(docItem.name)}
                      className="rounded border-slate-300 text-[var(--iris)] focus:ring-[var(--iris)] cursor-pointer w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="truncate block font-extrabold">{docItem.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate">
                        {docItem.specialty || "Ophthalmic Surgeon"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Event Date *
            </label>
            <input
              type="text"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Event Time *
            </label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>
        </div>

        {/* 6. Location & Organizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Venue / Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Organizer / Speaker
            </label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>
        </div>

        {/* 7. Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Event Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* 8. Starred / Permanent Event Toggle */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              <Star className={`w-4 h-4 ${formData.isStarred ? "text-amber-500 fill-amber-400" : "text-slate-400"}`} /> Star / Pin Event Permanently
            </label>
            <p className="text-[11px] text-amber-800 font-medium">
              Starred events will stay visible permanently even after their date has passed.
            </p>
          </div>
          <input
            type="checkbox"
            checked={formData.isStarred}
            onChange={(e) => setFormData((prev) => ({ ...prev, isStarred: e.target.checked }))}
            className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>

        {/* 9. Display Order */}
        <div className="space-y-1.5 max-w-xs">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Display Order *
          </label>
          <input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            required
            min={1}
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <Link
            href="/admin/media/events"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving Event..." : isEdit ? "Update Event" : "Publish Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
