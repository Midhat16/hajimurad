"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, Trash2, Sparkles, Sun, Eye, Activity, ShieldAlert, Smile, UserCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
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

export default function ServiceForm({ initialData = null, onSave, isSaving = false, title = "Add New Service" }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    icon: initialData?.icon || "Sparkles",
    color: initialData?.color || "from-sky-400 to-blue-500",
    features: initialData?.features && initialData.features.length > 0 ? initialData.features : [""],
    doctorIds: initialData?.doctorIds || [],
  });

  const [availableDoctors, setAvailableDoctors] = useState([]);

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
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        icon: initialData.icon || "Sparkles",
        color: initialData.color || "from-sky-400 to-blue-500",
        features: initialData.features && initialData.features.length > 0 ? initialData.features : [""],
        doctorIds: initialData.doctorIds || [],
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
      const updated = [...prev.features];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  const addFeatureInput = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };

  const removeFeatureInput = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Service title is required.");
    // Filter out empty features
    const cleanedData = {
      ...formData,
      features: formData.features.filter((f) => f.trim() !== ""),
    };
    onSave(cleanedData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[#D5E5DD] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="p-2 rounded-xl bg-white border border-[#D5E5DD] text-[#0B3D5C] hover:bg-[#E8F0EC] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
              Define eye treatment sub-specialty details, icon badge, and clinical highlights.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Service Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder=""
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Icon Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Icon Badge
            </label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
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
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Card Color Accent
            </label>
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
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
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Service Overview Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder=""
            className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Assigned Doctors Section */}
        <div className="p-5 rounded-2xl bg-[#E8F0EC]/60 border border-[#D5E5DD] space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#0B3D5C] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#3E8E6E]" />
              Assigned Doctors for this Service
            </h3>
            <p className="text-xs text-[#3F4B4A] font-semibold mt-0.5">
              Public appointment form par is service ko select karne par sirf yehi doctors dropdown me show honge.
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
                        ? "bg-white border-[#3E8E6E] shadow-xs"
                        : "bg-white/60 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#3E8E6E] rounded focus:ring-[#3E8E6E]"
                    />
                    <div className="truncate">
                      <p className="text-xs font-extrabold text-[#0B3D5C] truncate">
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

        {/* Features Dynamic Input List */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Key Procedure Features (Bullet points)
            </label>
            <button
              type="button"
              onClick={addFeatureInput}
              className="flex items-center gap-1 text-xs font-bold text-[#3E8E6E] hover:text-[#0B3D5C] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Feature Line
            </button>
          </div>

          <div className="space-y-2">
            {formData.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3E8E6E] flex-shrink-0" />
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder=""
                  className="flex-1 bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-2.5 text-xs text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeatureInput(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
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
            className="flex items-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Service..." : "Save Service Details"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
