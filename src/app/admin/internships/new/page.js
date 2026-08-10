"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, GraduationCap, Building2, Clock, Users, FileText, CheckCircle2 } from "lucide-react";

export default function AdminNewInternshipPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Ophthalmology");
  const [customDept, setCustomDept] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [seatsAvailable, setSeatsAvailable] = useState(5);
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const finalDept = department === "Other" ? customDept.trim() || "General" : department;

      await addDoc(collection(db, "internships"), {
        title: title.trim(),
        department: finalDept,
        duration: duration.trim() || "3 Months",
        seatsAvailable: Number(seatsAvailable) || 1,
        order: Number(order) || 1,
        isActive: isActive,
        description: description.trim(),
        requirements: requirements.trim(),
        createdAt: serverTimestamp(),
      });

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
            Fill in program details, department classification, and requirements.
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
                placeholder="Program title (e.g. Fellowship)"
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

            {/* Custom Dept if Other */}
            {department === "Other" && (
              <div>
                <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Custom Department Name</label>
                <input
                  type="text"
                  placeholder="Department / Speciality"
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
                placeholder="Program duration (e.g. 6 Months)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Seats Available */}
            <div>
              <label className="text-xs font-bold text-[#2B1F1A] block mb-1">Available Seats</label>
              <input
                type="number"
                min={1}
                value={seatsAvailable}
                onChange={(e) => setSeatsAvailable(e.target.value)}
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
              placeholder="Describe program details, goals, and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
            />
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
