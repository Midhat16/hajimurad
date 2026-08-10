"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Sun,
  Eye,
  Activity,
  ShieldAlert,
  Smile,
  UserCheck,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ICON_OPTIONS = [
  { label: "Sparkles (Refractive/LASIK)", value: "Sparkles" },
  { label: "Sun (Cataract/Lens)", value: "Sun" },
  { label: "Eye (Retina/Vision)", value: "Eye" },
  { label: "Activity (Glaucoma/Pressure)", value: "Activity" },
  { label: "Smile (Pediatric/Strabismus)", value: "Smile" },
  { label: "ShieldAlert (Cornea/Cross-Linking)", value: "ShieldAlert" },
];

const GRADIENT_OPTIONS = [
  { label: "Sky Blue to Blue", value: "from-sky-400 to-blue-500" },
  { label: "Amber to Orange", value: "from-amber-400 to-orange-500" },
  { label: "Emerald to Teal", value: "from-emerald-400 to-teal-500" },
  { label: "Indigo to Purple", value: "from-indigo-400 to-purple-500" },
  { label: "Rose to Pink", value: "from-rose-400 to-pink-500" },
  { label: "Violet to Fuchsia", value: "from-violet-400 to-fuchsia-500" },
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ServiceForm({ initialData = null, onSave, isSaving = false, title = "Add New Service" }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "Sparkles",
    color: initialData?.color || "from-sky-400 to-blue-500",
    features: initialData?.features && initialData.features.length > 0 ? initialData.features : [""],
    doctorIds: initialData?.doctorIds || [],
    minBookingDays: initialData?.minBookingDays !== undefined && initialData?.minBookingDays !== null ? initialData.minBookingDays : 0,
    maxBookingDays: initialData?.maxBookingDays !== undefined && initialData?.maxBookingDays !== null ? initialData.maxBookingDays : "",
    serviceStartTime: initialData?.serviceStartTime || "09:00",
    serviceEndTime: initialData?.serviceEndTime || "17:00",
    featureDoctorMappings: initialData?.featureDoctorMappings || [],
  });

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [expandedFeatures, setExpandedFeatures] = useState({});

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "doctors"),
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setAvailableDoctors(list);
        },
        (err) => {
          console.warn("Doctors subscription notice for ServiceForm:", err.message);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn("Failed to fetch doctors list for ServiceForm:", err);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      const rawFeatures = initialData.features && initialData.features.length > 0 ? initialData.features : [""];
      const rawMappings = initialData.featureDoctorMappings || [];

      // Ensure mappings align with features array
      const syncedMappings = rawFeatures.map((featName) => {
        const existing = rawMappings.find((m) => m.featureName === featName);
        return existing || { featureName: featName, assignedDoctorIds: [], doctorOverrides: {} };
      });

      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        icon: initialData.icon || "Sparkles",
        color: initialData.color || "from-sky-400 to-blue-500",
        features: rawFeatures,
        doctorIds: initialData.doctorIds || [],
        minBookingDays: initialData.minBookingDays !== undefined && initialData.minBookingDays !== null ? initialData.minBookingDays : 0,
        maxBookingDays: initialData.maxBookingDays !== undefined && initialData.maxBookingDays !== null ? initialData.maxBookingDays : "",
        serviceStartTime: initialData.serviceStartTime || "09:00",
        serviceEndTime: initialData.serviceEndTime || "17:00",
        featureDoctorMappings: syncedMappings,
      });
    }
  }, [initialData]);

  const toggleDoctorSelection = (doctorId) => {
    setFormData((prev) => {
      const current = prev.doctorIds || [];
      const updated = current.includes(doctorId)
        ? current.filter((id) => id !== doctorId)
        : [...current, doctorId];
      return { ...prev, doctorIds: updated };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (index, value) => {
    setFormData((prev) => {
      const updatedFeatures = [...prev.features];
      updatedFeatures[index] = value;

      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      if (!updatedMappings[index]) {
        updatedMappings[index] = { featureName: value, assignedDoctorIds: [], doctorOverrides: {} };
      } else {
        updatedMappings[index] = { ...updatedMappings[index], featureName: value };
      }

      return {
        ...prev,
        features: updatedFeatures,
        featureDoctorMappings: updatedMappings,
      };
    });
  };

  const addFeatureInput = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
      featureDoctorMappings: [
        ...(prev.featureDoctorMappings || []),
        { featureName: "", assignedDoctorIds: [], doctorOverrides: {} },
      ],
    }));
  };

  const removeFeatureInput = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
      featureDoctorMappings: (prev.featureDoctorMappings || []).filter((_, idx) => idx !== index),
    }));
  };

  const toggleFeatureAccordion = (index) => {
    setExpandedFeatures((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleFeatureDoctor = (featureIdx, doctorId) => {
    setFormData((prev) => {
      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      const targetMap = updatedMappings[featureIdx] || {
        featureName: prev.features[featureIdx] || "",
        assignedDoctorIds: [],
        doctorOverrides: {},
      };

      const currentDocIds = targetMap.assignedDoctorIds || [];
      const newDocIds = currentDocIds.includes(doctorId)
        ? currentDocIds.filter((id) => id !== doctorId)
        : [...currentDocIds, doctorId];

      updatedMappings[featureIdx] = {
        ...targetMap,
        assignedDoctorIds: newDocIds,
      };

      return { ...prev, featureDoctorMappings: updatedMappings };
    });
  };

  const toggleDoctorOverride = (featureIdx, doctorId) => {
    setFormData((prev) => {
      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      const targetMap = updatedMappings[featureIdx] || {
        featureName: prev.features[featureIdx] || "",
        assignedDoctorIds: [],
        doctorOverrides: {},
      };

      const currentOverrides = targetMap.doctorOverrides || {};
      const docOverride = currentOverrides[doctorId] || {
        enabled: false,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        startTime: prev.serviceStartTime || "09:00",
        endTime: prev.serviceEndTime || "17:00",
      };

      currentOverrides[doctorId] = {
        ...docOverride,
        enabled: !docOverride.enabled,
      };

      updatedMappings[featureIdx] = {
        ...targetMap,
        doctorOverrides: currentOverrides,
      };

      return { ...prev, featureDoctorMappings: updatedMappings };
    });
  };

  const toggleOverrideDay = (featureIdx, doctorId, dayName) => {
    setFormData((prev) => {
      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      const targetMap = updatedMappings[featureIdx];
      if (!targetMap) return prev;

      const currentOverrides = targetMap.doctorOverrides || {};
      const docOverride = currentOverrides[doctorId] || {
        enabled: true,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        startTime: prev.serviceStartTime || "09:00",
        endTime: prev.serviceEndTime || "17:00",
      };

      const currentDays = docOverride.days || [];
      const newDays = currentDays.includes(dayName)
        ? currentDays.filter((d) => d !== dayName)
        : [...currentDays, dayName];

      currentOverrides[doctorId] = {
        ...docOverride,
        days: newDays,
      };

      updatedMappings[featureIdx] = {
        ...targetMap,
        doctorOverrides: currentOverrides,
      };

      return { ...prev, featureDoctorMappings: updatedMappings };
    });
  };

  const handleOverrideTimeChange = (featureIdx, doctorId, field, value) => {
    setFormData((prev) => {
      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      const targetMap = updatedMappings[featureIdx];
      if (!targetMap) return prev;

      const currentOverrides = targetMap.doctorOverrides || {};
      const docOverride = currentOverrides[doctorId] || {
        enabled: true,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        startTime: prev.serviceStartTime || "09:00",
        endTime: prev.serviceEndTime || "17:00",
      };

      currentOverrides[doctorId] = {
        ...docOverride,
        [field]: value,
      };

      updatedMappings[featureIdx] = {
        ...targetMap,
        doctorOverrides: currentOverrides,
      };

      return { ...prev, featureDoctorMappings: updatedMappings };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Service title is required.");

    const minDays = Math.max(0, parseInt(formData.minBookingDays, 10) || 0);
    const rawMax = formData.maxBookingDays !== "" && formData.maxBookingDays !== null ? parseInt(formData.maxBookingDays, 10) : null;
    const maxDays = rawMax !== null && !isNaN(rawMax) && rawMax > 0 ? rawMax : null;

    const cleanedFeatures = formData.features.filter((f) => f.trim() !== "");
    const cleanedMappings = (formData.featureDoctorMappings || [])
      .filter((m) => m.featureName && m.featureName.trim() !== "")
      .map((m) => ({
        featureName: m.featureName.trim(),
        assignedDoctorIds: m.assignedDoctorIds || [],
        doctorOverrides: m.doctorOverrides || {},
      }));

    const cleanedData = {
      ...formData,
      minBookingDays: minDays,
      maxBookingDays: maxDays,
      features: cleanedFeatures,
      featureDoctorMappings: cleanedMappings,
    };
    onSave(cleanedData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="p-2 rounded-xl bg-white border border-[var(--line)] text-[#2B1F1A] hover:bg-[var(--fog)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              Define eye treatment details, operating hours, feature-specific doctor assignments, and custom timing overrides.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Service Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Diagnostics & Imaging"
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Icon Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Icon Badge
            </label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            >
              {ICON_OPTIONS.map((ico) => (
                <option key={ico.value} value={ico.value}>
                  {ico.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gradient Color Accent */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Card Color Accent
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            >
              {GRADIENT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Service Overview Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Comprehensive diagnostic evaluations using advanced ocular imaging..."
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* NEW SECTION 1: Service Operating Hours */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[var(--iris)]" />
              Service Operating Hours (Overall Service Schedule)
            </h3>
            <p className="text-xs text-[var(--slate)] font-semibold mt-0.5">
              Specify the default daily operating window for this specific service (e.g. 09:00 AM - 05:00 PM).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Service Start Time */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Service Start Time *
              </label>
              <input
                type="time"
                name="serviceStartTime"
                value={formData.serviceStartTime}
                onChange={handleChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] rounded-xl px-4 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-2 transition-all"
              />
            </div>

            {/* Service End Time */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Service End Time *
              </label>
              <input
                type="time"
                name="serviceEndTime"
                value={formData.serviceEndTime}
                onChange={handleChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] rounded-xl px-4 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-2 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Appointment Booking Window Settings (Min / Max Days) */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
              <CalendarDays className="w-4.5 h-4.5 text-amber-700" />
              Appointment Booking Window (Min & Max Days)
            </h3>
            <p className="text-xs text-amber-900/80 font-semibold mt-0.5">
              Specify the allowable booking lead-time range for this service. The patient calendar will dynamically disable all dates outside this range.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Minimum Booking Days */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <label className="text-xs font-black text-[#2B1F1A] uppercase tracking-wider block">
                Minimum Days Before Booking *
              </label>
              <input
                type="number"
                name="minBookingDays"
                min="0"
                value={formData.minBookingDays}
                onChange={handleChange}
                placeholder="0"
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-2.5 text-sm text-[#2B1F1A] font-extrabold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Maximum Booking Days Window */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <label className="text-xs font-black text-[#2B1F1A] uppercase tracking-wider block">
                Total Selectable Days Window *
              </label>
              <input
                type="number"
                name="maxBookingDays"
                min="1"
                value={formData.maxBookingDays}
                onChange={handleChange}
                placeholder="e.g. 5 or 10"
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-2.5 text-sm text-[#2B1F1A] font-extrabold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>
        </div>

        {/* General Service Doctors Section (Fallback) */}
        <div className="p-5 rounded-2xl bg-[var(--fog)]/60 border border-[var(--line)] space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--iris)]" />
              General Doctors assigned to this Service (Overall Fallback)
            </h3>
            <p className="text-xs text-[var(--slate)] font-semibold mt-0.5">
              These doctors handle this service in general when no feature-specific assignment is selected.
            </p>
          </div>

          {availableDoctors.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic">
              No doctors created yet. Please add doctor profiles first in Admin &gt; Doctors.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {availableDoctors.map((doc) => {
                const isSelected = (formData.doctorIds || []).includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    onClick={() => toggleDoctorSelection(doc.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-white border-[var(--iris)] shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-[var(--iris)] rounded focus:ring-[var(--iris)]"
                    />
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-[#2B1F1A] truncate">
                        {doc.name}
                      </p>
                      {doc.specialty && (
                        <p className="text-[10px] font-semibold text-slate-500 truncate">
                          {doc.specialty}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* NEW SECTION 2 & 3: Granular Feature-to-Doctor Assignment & Timing Overrides */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#2B1F1A] flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-[var(--iris)]" />
                Granular Feature & Doctor Assignment Controls
              </h3>
              <p className="text-xs text-[var(--slate)] font-semibold mt-0.5">
                Assign specific doctors and custom timing overrides for each treatment/feature under this service.
              </p>
            </div>
            <button
              type="button"
              onClick={addFeatureInput}
              className="flex items-center gap-1.5 bg-[var(--iris)] hover:bg-[var(--ink)] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Feature Treatment
            </button>
          </div>

          <div className="space-y-4">
            {formData.features.map((feat, idx) => {
              const mapping = (formData.featureDoctorMappings || [])[idx] || {
                featureName: feat,
                assignedDoctorIds: [],
                doctorOverrides: {},
              };
              const assignedCount = (mapping.assignedDoctorIds || []).length;
              const isExpanded = !!expandedFeatures[idx];

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-xs transition-all"
                >
                  {/* Feature Header Bar */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--iris)] flex-shrink-0" />
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      placeholder={`Feature #${idx + 1} Name (e.g. OCT Macula SCAN)`}
                      className="flex-1 bg-white border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3.5 py-2 text-xs font-bold text-[#2B1F1A] focus:outline-none focus:ring-2"
                    />

                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-[var(--iris)] border border-indigo-100 shrink-0">
                      {assignedCount} Doctor{assignedCount === 1 ? "" : "s"} Assigned
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleFeatureAccordion(idx)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Toggle Feature Doctor Assignments"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeatureInput(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Feature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Accordion Content: Feature-to-Doctor Selection & Overrides */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 space-y-4 bg-white"
                      >
                        <div className="space-y-2">
                          <label className="text-[11px] font-extrabold text-[#2B1F1A] uppercase tracking-wider block">
                            Assign Doctors for "{feat || `Feature #${idx + 1}`}"
                          </label>

                          {availableDoctors.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No doctors available.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {availableDoctors.map((docObj) => {
                                const isAssigned = (mapping.assignedDoctorIds || []).includes(docObj.id);
                                const docOverride = (mapping.doctorOverrides || {})[docObj.id] || {
                                  enabled: false,
                                  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                                  startTime: formData.serviceStartTime || "09:00",
                                  endTime: formData.serviceEndTime || "17:00",
                                };

                                return (
                                  <div
                                    key={docObj.id}
                                    className={`p-3 rounded-xl border transition-all ${
                                      isAssigned
                                        ? "bg-indigo-50/40 border-indigo-200"
                                        : "bg-slate-50/50 border-slate-200 opacity-80"
                                    }`}
                                  >
                                    <div
                                      onClick={() => toggleFeatureDoctor(idx, docObj.id)}
                                      className="flex items-center justify-between cursor-pointer select-none"
                                    >
                                      <div className="flex items-center gap-2.5 truncate">
                                        <input
                                          type="checkbox"
                                          checked={isAssigned}
                                          onChange={() => {}}
                                          className="w-4 h-4 text-[var(--iris)] rounded"
                                        />
                                        <div className="truncate">
                                          <p className="text-xs font-bold text-[#2B1F1A] truncate">
                                            {docObj.name}
                                          </p>
                                          {docObj.specialty && (
                                            <p className="text-[10px] text-slate-500 font-semibold truncate">
                                              {docObj.specialty}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {isAssigned && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                          Assigned
                                        </span>
                                      )}
                                    </div>

                                    {/* Timing Override Section for Assigned Doctor */}
                                    {isAssigned && (
                                      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2.5">
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-indigo-900 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={!!docOverride.enabled}
                                            onChange={() => toggleDoctorOverride(idx, docObj.id)}
                                            className="w-3.5 h-3.5 text-[var(--iris)] rounded"
                                          />
                                          <span>Override timing for this feature/service</span>
                                        </label>

                                        {docOverride.enabled && (
                                          <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-3">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                              Custom Operating Days:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {WEEKDAYS.map((day) => {
                                                const isDayActive = (docOverride.days || []).includes(day);
                                                return (
                                                  <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => toggleOverrideDay(idx, docObj.id, day)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                      isDayActive
                                                        ? "bg-[var(--iris)] text-white shadow-xs"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                                  >
                                                    {day.slice(0, 3)}
                                                  </button>
                                                );
                                              })}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                                  Start Time
                                                </label>
                                                <input
                                                  type="time"
                                                  value={docOverride.startTime || "09:00"}
                                                  onChange={(e) =>
                                                    handleOverrideTimeChange(idx, docObj.id, "startTime", e.target.value)
                                                  }
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-[#2B1F1A]"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                                  End Time
                                                </label>
                                                <input
                                                  type="time"
                                                  value={docOverride.endTime || "17:00"}
                                                  onChange={(e) =>
                                                    handleOverrideTimeChange(idx, docObj.id, "endTime", e.target.value)
                                                  }
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-[#2B1F1A]"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Footer Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/services"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Service..." : "Save Service Details"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
