"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImagePicker from "./ImagePicker";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TechnologyForm({ initialData = null, onSave, isSaving = false, title = "Add New Technology" }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    status: initialData?.status || "System Calibrated & Online",
    order: initialData?.order ?? 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "",
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        status: initialData.status || "System Calibrated & Online",
        order: initialData.order ?? 1,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Technology name is required.");
    onSave({
      ...formData,
      order: Number(formData.order) || 1,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[#D5E5DD] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/technologies"
            className="p-2 rounded-xl bg-white border border-[#D5E5DD] text-[#0B3D5C] hover:bg-[#E8F0EC] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
              Add or modify hardware diagnostic equipment and laser technology platforms.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-sm space-y-6">
        
        {/* Image Picker */}
        <ImagePicker
          label="Equipment Image (Uploaded to ImgBB)"
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Equipment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder=""
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Medical Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Status badge text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Calibration / Telemetry Status
            </label>
            <input
              type="text"
              name="status"
              value={formData.status}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Display Sequence Order (1, 2, 3...)
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min={1}
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Equipment Overview & Specifications
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

        {/* Form Footer Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/technologies"
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
            {isSaving ? "Saving Technology..." : "Save Technology Equipment"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
