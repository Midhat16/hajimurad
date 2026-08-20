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
  RotateCcw,
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

  const [allServicesList, setAllServicesList] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateCopiedNotice, setTemplateCopiedNotice] = useState("");

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "services"),
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
          setAllServicesList(list);
        },
        (err) => {
          console.warn("Services subscription notice for ServiceForm template list:", err.message);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn("Failed to fetch services template list:", err);
    }
  }, []);

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

      // Ensure mappings align with features array and have assignedDoctors
      const syncedMappings = rawFeatures.map((featName) => {
        const existing = rawMappings.find((m) => m.featureName === featName);
        if (existing) {
          const assignedIds = existing.assignedDoctorIds || [];
          const assignedDocs = existing.assignedDoctors || assignedIds.map((docId) => {
            const ov = (existing.doctorOverrides || {})[docId];
            return {
              doctorId: docId,
              timing: {
                start: ov?.startTime || initialData.serviceStartTime || "09:00",
                end: ov?.endTime || initialData.serviceEndTime || "17:00",
                days: ov?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                isOverride: !!ov?.enabled,
              },
            };
          });
          return { ...existing, featureName: featName, assignedDoctorIds: assignedIds, assignedDoctors: assignedDocs };
        }
        return { featureName: featName, assignedDoctorIds: [], assignedDoctors: [], doctorOverrides: {} };
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

  const handleSelectTemplate = (e) => {
    const serviceId = e.target.value;
    setSelectedTemplateId(serviceId);

    if (!serviceId) {
      setTemplateCopiedNotice("");
      return;
    }

    const selectedSvc = allServicesList.find((s) => s.id === serviceId);
    if (!selectedSvc) return;

    const rawFeatures = selectedSvc.features && selectedSvc.features.length > 0 ? selectedSvc.features : [""];
    const rawMappings = selectedSvc.featureDoctorMappings || [];

    const syncedMappings = rawFeatures.map((featName) => {
      const existing = rawMappings.find((m) => m.featureName === featName);
      if (existing) {
        const assignedIds = existing.assignedDoctorIds || [];
        const assignedDocs = existing.assignedDoctors || assignedIds.map((docId) => {
          const ov = (existing.doctorOverrides || {})[docId];
          return {
            doctorId: docId,
            timing: {
              start: ov?.startTime || selectedSvc.serviceStartTime || "09:00",
              end: ov?.endTime || selectedSvc.serviceEndTime || "17:00",
              days: ov?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              isOverride: !!ov?.enabled,
            },
          };
        });
        return { ...existing, featureName: featName, assignedDoctorIds: assignedIds, assignedDoctors: assignedDocs };
      }
      return { featureName: featName, assignedDoctorIds: [], assignedDoctors: [], doctorOverrides: {} };
    });

    setFormData({
      title: selectedSvc.title || "",
      description: selectedSvc.description || "",
      icon: selectedSvc.icon || "Sparkles",
      color: selectedSvc.color || "from-sky-400 to-blue-500",
      features: rawFeatures,
      doctorIds: selectedSvc.doctorIds || [],
      minBookingDays: selectedSvc.minBookingDays !== undefined && selectedSvc.minBookingDays !== null ? selectedSvc.minBookingDays : 0,
      maxBookingDays: selectedSvc.maxBookingDays !== undefined && selectedSvc.maxBookingDays !== null ? selectedSvc.maxBookingDays : "",
      serviceStartTime: selectedSvc.serviceStartTime || "09:00",
      serviceEndTime: selectedSvc.serviceEndTime || "17:00",
      featureDoctorMappings: syncedMappings,
    });

    setTemplateCopiedNotice(`Successfully pre-filled form using template "${selectedSvc.title || "Service"}". You can freely edit any details below.`);
  };

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
        updatedMappings[index] = { featureName: value, assignedDoctorIds: [], assignedDoctors: [], doctorOverrides: {} };
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
        { featureName: "", assignedDoctorIds: [], assignedDoctors: [], doctorOverrides: {} },
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
        assignedDoctors: [],
        doctorOverrides: {},
      };

      const currentDocIds = targetMap.assignedDoctorIds || [];
      const currentAssignedDocs = targetMap.assignedDoctors || [];
      const isCurrentlyAssigned = currentDocIds.includes(doctorId);

      let newDocIds = [];
      let newAssignedDocs = [];

      if (isCurrentlyAssigned) {
        newDocIds = currentDocIds.filter((id) => id !== doctorId);
        newAssignedDocs = currentAssignedDocs.filter((d) => d.doctorId !== doctorId);
      } else {
        newDocIds = [...currentDocIds, doctorId];
        newAssignedDocs = [
          ...currentAssignedDocs,
          {
            doctorId,
            timing: {
              start: prev.serviceStartTime || "09:00",
              end: prev.serviceEndTime || "17:00",
              days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              isOverride: false,
            },
          },
        ];
      }

      // Keep legacy doctorOverrides sync'd
      const newOverrides = { ...(targetMap.doctorOverrides || {}) };
      if (!isCurrentlyAssigned) {
        newOverrides[doctorId] = {
          enabled: false,
          startTime: prev.serviceStartTime || "09:00",
          endTime: prev.serviceEndTime || "17:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        };
      } else {
        delete newOverrides[doctorId];
      }

      updatedMappings[featureIdx] = {
        ...targetMap,
        assignedDoctorIds: newDocIds,
        assignedDoctors: newAssignedDocs,
        doctorOverrides: newOverrides,
      };

      return { ...prev, featureDoctorMappings: updatedMappings };
    });
  };

  const handleDoctorTimingChange = (featureIdx, doctorId, field, value) => {
    setFormData((prev) => {
      const updatedMappings = [...(prev.featureDoctorMappings || [])];
      const targetMap = updatedMappings[featureIdx];
      if (!targetMap) return prev;

      let currentAssignedDocs = [...(targetMap.assignedDoctors || [])];
      let docIndex = currentAssignedDocs.findIndex((d) => d.doctorId === doctorId);

      if (docIndex === -1) {
        currentAssignedDocs.push({
          doctorId,
          timing: {
            start: prev.serviceStartTime || "09:00",
            end: prev.serviceEndTime || "17:00",
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            isOverride: false,
          },
        });
        docIndex = currentAssignedDocs.length - 1;
      }

      const existingTiming = currentAssignedDocs[docIndex].timing || {
        start: prev.serviceStartTime || "09:00",
        end: prev.serviceEndTime || "17:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        isOverride: false,
      };

      let updatedTiming = { ...existingTiming };

      if (field === "resetDefault") {
        updatedTiming = {
          start: prev.serviceStartTime || "09:00",
          end: prev.serviceEndTime || "17:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          isOverride: false,
        };
      } else if (field === "dayToggle") {
        const dayName = value;
        const currentDays = updatedTiming.days || [];
        const newDays = currentDays.includes(dayName)
          ? currentDays.filter((d) => d !== dayName)
          : [...currentDays, dayName];

        updatedTiming = {
          ...updatedTiming,
          days: newDays,
          isOverride: true,
        };
      } else {
        // "start" or "end" time change
        updatedTiming = {
          ...updatedTiming,
          [field]: value,
          isOverride: true,
        };
      }

      currentAssignedDocs[docIndex] = {
        ...currentAssignedDocs[docIndex],
        timing: updatedTiming,
      };

      // Also sync doctorOverrides map for backward compatibility
      const updatedOverrides = { ...(targetMap.doctorOverrides || {}) };
      updatedOverrides[doctorId] = {
        enabled: updatedTiming.isOverride,
        startTime: updatedTiming.start,
        endTime: updatedTiming.end,
        days: updatedTiming.days,
      };

      updatedMappings[featureIdx] = {
        ...targetMap,
        assignedDoctors: currentAssignedDocs,
        doctorOverrides: updatedOverrides,
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
        assignedDoctors: m.assignedDoctors || [],
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
              Define eye treatment details, operating hours, and per-doctor feature-specific timing assignments.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title & Template Copy Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Service Title *
              </label>
              {!initialData && allServicesList.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-[var(--iris)] text-[11px]">Copy from template:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={handleSelectTemplate}
                    className="bg-[var(--fog)] border border-slate-300 focus:border-[var(--iris)] rounded-xl px-3 py-1.5 text-xs text-[#2B1F1A] font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Existing Service Template --</option>
                    {allServicesList.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.title || svc.name || "Untitled"} {svc.isDeleted ? " (Deleted)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder=""
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
            placeholder=""
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Service Operating Hours */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#2B1F1A] flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[var(--iris)]" />
              Service Operating Hours (Overall Service Default Timing)
            </h3>
            <p className="text-xs text-[var(--slate)] font-semibold mt-0.5">
              Specify the default daily operating window for this service (e.g. 09:00 AM - 05:00 PM). Assigned doctors will inherit this timing unless customized per feature.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Service Start Time */}
            <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Service Default Start Time *
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
                Service Default End Time *
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
                placeholder=""
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
              These doctors handle this service in general when no feature-specific treatment is selected by patient.
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
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isSelected
                        ? "bg-white border-[var(--iris)] shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
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

        {/* Feature & Per-Doctor Timing Assignment Controls */}
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#2B1F1A] flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-[var(--iris)]" />
                Assign Doctors & Per-Doctor Timing per Feature
              </h3>
              <p className="text-xs text-[var(--slate)] font-semibold mt-0.5">
                Assign specific doctors to treatment features. Each assigned doctor gets an immediate timing field pre-filled with the service default.
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
                assignedDoctors: [],
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
                      placeholder={`Feature #${idx + 1} Name`}
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

                  {/* Accordion Content: Feature-to-Doctor Selection & Immediate Timing */}
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
                            Assign Doctors & Set Timing for "{feat || `Feature #${idx + 1}`}"
                          </label>

                          {availableDoctors.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No doctors available.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {availableDoctors.map((docObj) => {
                                const isAssigned = (mapping.assignedDoctorIds || []).includes(docObj.id);

                                // Find per-doctor timing assignment entry
                                const docAssignedEntry = (mapping.assignedDoctors || []).find(
                                  (d) => d.doctorId === docObj.id
                                );

                                const docTiming = docAssignedEntry?.timing || {
                                  start: formData.serviceStartTime || "09:00",
                                  end: formData.serviceEndTime || "17:00",
                                  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                                  isOverride: false,
                                };

                                const displayStart = docTiming.isOverride
                                  ? docTiming.start
                                  : formData.serviceStartTime || "09:00";
                                const displayEnd = docTiming.isOverride
                                  ? docTiming.end
                                  : formData.serviceEndTime || "17:00";

                                return (
                                  <div
                                    key={docObj.id}
                                    className={`p-3.5 rounded-2xl border transition-all ${isAssigned
                                        ? "bg-indigo-50/40 border-indigo-200 shadow-xs"
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
                                          onChange={() => { }}
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
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                          Assigned
                                        </span>
                                      )}
                                    </div>

                                    {/* Immediate Timing Field for Every Assigned Doctor */}
                                    {isAssigned && (
                                      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <label className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-[var(--iris)]" />
                                            Doctor Timing for this Feature:
                                          </label>

                                          {!docTiming.isOverride ? (
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                              Using service default timing ({formData.serviceStartTime || "09:00"} - {formData.serviceEndTime || "17:00"})
                                            </span>
                                          ) : (
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                                Custom Timing Override
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleDoctorTimingChange(idx, docObj.id, "resetDefault")}
                                                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline flex items-center gap-1 cursor-pointer"
                                                title="Reset timing to service default"
                                              >
                                                <RotateCcw className="w-3 h-3" />
                                                Reset to Default
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-3">
                                          <div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                              Operating Days for {docObj.name}:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                              {WEEKDAYS.map((day) => {
                                                const activeDays = docTiming.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                                const isDayActive = activeDays.includes(day);
                                                return (
                                                  <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDoctorTimingChange(idx, docObj.id, "dayToggle", day)}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isDayActive
                                                        ? "bg-[var(--iris)] text-white shadow-xs"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                      }`}
                                                  >
                                                    {day.slice(0, 3)}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div>
                                              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                                Start Time
                                              </label>
                                              <input
                                                type="time"
                                                value={displayStart}
                                                onChange={(e) =>
                                                  handleDoctorTimingChange(idx, docObj.id, "start", e.target.value)
                                                }
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-[var(--iris)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2B1F1A]"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                                End Time
                                              </label>
                                              <input
                                                type="time"
                                                value={displayEnd}
                                                onChange={(e) =>
                                                  handleDoctorTimingChange(idx, docObj.id, "end", e.target.value)
                                                }
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-[var(--iris)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2B1F1A]"
                                              />
                                            </div>
                                          </div>
                                        </div>
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
            className="flex items-center gap-2 bg-[#1E1433] hover:bg-[#2A1C47] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Service..." : "Save Service Details"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
