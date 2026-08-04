"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, GraduationCap, AlertCircle } from "lucide-react";

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
  const [seatsAvailable, setSeatsAvailable] = useState(5);
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No internship ID provided.");
      setLoading(false);
      return;
    }

    async function fetchProgram() {
      try {
        const docRef = doc(db, "internships", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");

          const knownDepts = ["Ophthalmology", "Optometry", "Nursing", "Administration"];
          if (knownDepts.includes(data.department)) {
            setDepartment(data.department);
          } else {
            setDepartment("Other");
            setCustomDept(data.department || "");
          }

          setDuration(data.duration || "3 Months");
          setSeatsAvailable(data.seatsAvailable || 5);
          setOrder(data.order || 1);
          setIsActive(data.isActive !== false);
          setDescription(data.description || "");
          setRequirements(data.requirements || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !id) return;

    setIsSubmitting(true);
    try {
      const finalDept = department === "Other" ? customDept.trim() || "General" : department;

      await updateDoc(doc(db, "internships", id), {
        title: title.trim(),
        department: finalDept,
        duration: duration.trim() || "3 Months",
        seatsAvailable: Number(seatsAvailable) || 1,
        order: Number(order) || 1,
        isActive: isActive,
        description: description.trim(),
        requirements: requirements.trim(),
      });

      router.push("/admin/internships");
    } catch (err) {
      console.error("Error updating internship:", err);
      alert("Failed to update internship program.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] max-w-xl mx-auto shadow-sm">
        <div className="w-8 h-8 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-[var(--ink)] uppercase">Loading Program Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[var(--line)] text-center max-w-xl mx-auto space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-extrabold text-[var(--ink)]">{error}</h3>
        <Link
          href="/admin/internships"
          className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[var(--iris-dark)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Internships
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/internships"
        className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--ink)] hover:text-[var(--iris)] transition-colors bg-white px-4 py-2 rounded-xl border border-[var(--line)] shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Internships
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Edit Program
          </span>
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            Edit Internship Program
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Modify program details, department classification, and requirements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">
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
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Department</label>
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
                <label className="text-xs font-bold text-[var(--ink)] block mb-1">Custom Department Name</label>
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
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
              />
            </div>

            {/* Seats Available */}
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Available Seats</label>
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
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Display Priority Order</label>
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
              <label htmlFor="isActive" className="text-xs font-bold text-[var(--ink)] cursor-pointer">
                Publicly Active & Open For Applications
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-[var(--ink)] block mb-1">
              Program Description & Responsibilities
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] resize-none"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-bold text-[var(--ink)] block mb-1">
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
          <p className="text-xs font-bold text-[var(--ink)] uppercase">Loading Editor...</p>
        </div>
      }
    >
      <EditInternshipFormContent />
    </Suspense>
  );
}
