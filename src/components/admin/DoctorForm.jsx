"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImagePicker from "./ImagePicker";
import { Save, ArrowLeft, Calendar, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const GRADIENT_OPTIONS = [
  { label: "Sky Blue to Deep Blue", value: "from-sky-400 to-blue-500" },
  { label: "Teal to Emerald Green", value: "from-teal-400 to-emerald-500" },
  { label: "Rose Red to Vibrant Pink", value: "from-rose-400 to-pink-500" },
  { label: "Violet to Indigo Purple", value: "from-violet-400 to-indigo-500" },
  { label: "Amber Yellow to Orange", value: "from-amber-400 to-orange-500" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorForm({ initialData = null, onSave, isSaving = false, title = "Add New Doctor" }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    role: initialData?.role || "",
    specialty: initialData?.specialty || "",
    education: initialData?.education || "",
    fellowship: initialData?.fellowship || "",
    pmdcNo: initialData?.pmdcNo || "",
    bio: initialData?.bio || "",
    metrics: initialData?.metrics || "",
    gradient: initialData?.gradient || "from-sky-400 to-blue-500",
    initials: initialData?.initials || "",
    photoUrl: initialData?.photoUrl || initialData?.photo || initialData?.imageUrl || "",
    loginEmail: initialData?.loginEmail || initialData?.email || "",
    loginPassword: initialData?.loginPassword || initialData?.password || "",
    workingDays: initialData?.workingDays && Array.isArray(initialData.workingDays) && initialData.workingDays.length > 0
      ? initialData.workingDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    workingHours: initialData?.workingHours || { start: "09:00", end: "15:00" },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        role: initialData.role || "",
        specialty: initialData.specialty || "",
        education: initialData.education || "",
        fellowship: initialData.fellowship || "",
        pmdcNo: initialData.pmdcNo || "",
        bio: initialData.bio || "",
        metrics: initialData.metrics || "",
        gradient: initialData.gradient || "from-sky-400 to-blue-500",
        initials: initialData.initials || "",
        photoUrl: initialData.photoUrl || initialData.photo || initialData.imageUrl || "",
        loginEmail: initialData.loginEmail || initialData.email || "",
        loginPassword: initialData.loginPassword || initialData.password || "",
        workingDays: initialData.workingDays && Array.isArray(initialData.workingDays) && initialData.workingDays.length > 0
          ? initialData.workingDays
          : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        workingHours: initialData.workingHours || { start: "09:00", end: "15:00" },
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto compute initials if name changed and initials is empty or matching old initials
      if (name === "name" && value.trim()) {
        const parts = value.trim().replace(/^Dr\.\s*/i, "").split(" ");
        if (parts.length >= 2) {
          updated.initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts[0]?.length >= 2) {
          updated.initials = parts[0].slice(0, 2).toUpperCase();
        }
      }
      return updated;
    });
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const current = prev.workingDays || [];
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return { ...prev, workingDays: updated };
    });
  };

  const handleHoursChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...(prev.workingHours || { start: "09:00", end: "15:00" }),
        [name]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Doctor Name is required.");
    if (!formData.role.trim()) return alert("Hospital Role is required.");
    if (!formData.education.trim()) return alert("Education is required.");
    if (!formData.loginEmail.trim()) return alert("Login Email is required.");
    if (!formData.loginPassword.trim()) return alert("Login Password is required.");
    if (!formData.workingDays || formData.workingDays.length === 0) {
      return alert("At least one Working Day must be selected.");
    }
    if (!formData.workingHours?.start || !formData.workingHours?.end) {
      return alert("Working Hours (Start and End time) are required.");
    }

    // Compute initials fallback if empty
    let finalInitials = formData.initials;
    if (!finalInitials || !finalInitials.trim()) {
      const parts = formData.name.trim().replace(/^Dr\.\s*/i, "").split(" ");
      if (parts.length >= 2) {
        finalInitials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts[0]?.length >= 2) {
        finalInitials = parts[0].slice(0, 2).toUpperCase();
      } else {
        finalInitials = "DR";
      }
    }

    onSave({
      ...formData,
      initials: finalInitials,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/doctors"
            className="p-2 rounded-xl bg-white border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--fog)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              Fill in all doctor credentials and upload a photo for the public doctor profile card.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
        
        {/* Photo Picker */}
        <ImagePicker
          label="Doctor Photograph (Uploaded to ImgBB)"
          value={formData.photoUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, photoUrl: url }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Doctor Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder=""
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Hospital Role / Designation
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Specialty Sub-Field
            </label>
            <input
              type="text"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Education */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Medical Education / Degree
            </label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Fellowship */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Fellowship Training
            </label>
            <input
              type="text"
              name="fellowship"
              value={formData.fellowship}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* PMDC Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              PMDC Registration No.
            </label>
            <input
              type="text"
              name="pmdcNo"
              value={formData.pmdcNo}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>


          {/* Structured Schedule Configuration Section */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-[var(--fog)]/80 border border-[var(--line)] space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--iris)]" /> Doctor Working Days & Hours (Required)
              </h3>
              <p className="text-xs text-[var(--slate)] mt-0.5 font-medium">
                Set doctor's official days & working hours. Sunday is permanently closed for appointments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Working Days Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                  Working Days * (Select Days)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isChecked = (formData.workingDays || []).includes(day);
                    return (
                      <label
                        key={day}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                          isChecked
                            ? "bg-white border-[var(--iris)] text-[var(--iris)] shadow-xs"
                            : "bg-white/50 border-[var(--line)] text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDayToggle(day)}
                          className="w-4 h-4 rounded text-[var(--iris)] focus:ring-[var(--iris)]"
                        />
                        <span>{day.slice(0, 3)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours Pickers */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                  Working Hours * (Start & End Time)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Start Time</span>
                    <input
                      type="time"
                      name="start"
                      value={formData.workingHours?.start || "09:00"}
                      onChange={handleHoursChange}
                      required
                      className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-4 transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">End Time</span>
                    <input
                      type="time"
                      name="end"
                      value={formData.workingHours?.end || "15:00"}
                      onChange={handleHoursChange}
                      required
                      className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-4 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Track Record / Metrics Badge
            </label>
            <input
              type="text"
              name="metrics"
              value={formData.metrics}
              onChange={handleChange}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Card Gradient Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Card Avatar Gradient Accent
            </label>
            <select
              name="gradient"
              value={formData.gradient}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            >
              {GRADIENT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Initials */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Fallback Initials (2 letters)
            </label>
            <input
              type="text"
              name="initials"
              value={formData.initials}
              onChange={handleChange}
              maxLength={3}
              placeholder=""
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>
        </div>

        {/* Account Credentials Section (Private for Doctor Login) */}
        <div className="p-5 rounded-2xl bg-[var(--fog)]/60 border border-[var(--line)] space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--ink)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--iris)]" /> Doctor Account Credentials
            </h3>
            <p className="text-xs text-[var(--slate)] mt-0.5 font-semibold">
              Ye sirf doctor login ke liye hain, public site par kabhi nahi dikhengi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Login Email
              </label>
              <input
                type="email"
                name="loginEmail"
                value={formData.loginEmail}
                onChange={handleChange}
                autoComplete="off"
                placeholder="doctor@example.com"
                className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Login Password
              </label>
              <input
                type="text"
                name="loginPassword"
                value={formData.loginPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Password"
                className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
            Doctor Bio & Overview
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            placeholder=""
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Form Footer Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/doctors"
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
            {isSaving ? "Saving Doctor..." : "Save Doctor Profile"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
