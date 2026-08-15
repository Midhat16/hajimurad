"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Sparkles, AlertCircle, CheckCircle2, Award, Trophy, Users, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImagePicker from "@/components/admin/ImagePicker";

const DEFAULT_WHY_CONTENT = {
  badgeText: "Pioneering Vision Science",
  heading: "Setting New Milestones in Ophthalmic Excellence",
  description: "Haji Murad Eye Hospital is not just an eye clinic; it is a specialized center of vision science. We combine decades of experience with advanced diagnostics to resolve vision issues before they disrupt your life.",
  yearsExperience: 25,
  successfulSurgeries: 45000,
  certifiedSpecialists: 18,
  patientSuccessRate: 99.8,
  points: [
    {
      title: "FDA-Approved Surgical Tech",
      description: "Every laser and scanning machine we utilize is state-of-the-art and certified by international health boards.",
    },
    {
      title: "Patient-First Care Structure",
      description: "Personalized outpatient care plans and a lifetime follow-up guarantee for all surgical procedures.",
    },
    {
      title: "Advanced Cornea Topography",
      description: "Using high-resolution wavefront imaging to construct highly precise customized profiles for your eyes.",
    },
  ],
};

export default function AdminWhyChooseUsPage() {
  const [formData, setFormData] = useState(DEFAULT_WHY_CONTENT);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchWhyContent() {
      try {
        const snap = await getDoc(doc(db, "siteContent", "whyChooseUs"));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            ...DEFAULT_WHY_CONTENT,
            ...data,
            points: Array.isArray(data.points) && data.points.length > 0
              ? data.points.map((p) => ({
                title: p.title || "",
                description: p.description || "",
                iconUrl: p.iconUrl || p.icon || "",
              }))
              : DEFAULT_WHY_CONTENT.points,
          });
        }
      } catch (err) {
        console.error("Error fetching Why Choose Us content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWhyContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePointChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedPoints = [...prev.points];
      updatedPoints[index] = {
        ...updatedPoints[index],
        [field]: value,
      };
      return { ...prev, points: updatedPoints };
    });
  };

  const handleAddPoint = () => {
    setFormData((prev) => ({
      ...prev,
      points: [...prev.points, { title: "", description: "", iconUrl: "" }],
    }));
  };

  const handleRemovePoint = (index) => {
    setFormData((prev) => {
      if (prev.points.length <= 1) {
        setError("At least one highlight point is required.");
        return prev;
      }
      const updated = prev.points.filter((_, idx) => idx !== index);
      return { ...prev, points: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSavedSuccess(false);

    if (!formData.badgeText.trim() || !formData.heading.trim() || !formData.description.trim()) {
      setError("Badge text, heading, and description are required.");
      return;
    }

    const validPoints = formData.points
      .map((p) => ({
        title: p.title.trim(),
        description: p.description.trim(),
        iconUrl: (p.iconUrl || p.icon || "").trim(),
      }))
      .filter((p) => p.title || p.description);

    if (validPoints.length === 0) {
      setError("Please add at least one highlight point with title or description.");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "whyChooseUs"), {
        badgeText: formData.badgeText.trim(),
        heading: formData.heading.trim(),
        description: formData.description.trim(),
        yearsExperience: Number(formData.yearsExperience) || 0,
        successfulSurgeries: Number(formData.successfulSurgeries) || 0,
        certifiedSpecialists: Number(formData.certifiedSpecialists) || 0,
        patientSuccessRate: Number(formData.patientSuccessRate) || 0,
        points: validPoints,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving Why Choose Us content:", err);
      setError("Failed to save Why Choose Us content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading "Why Choose Us" Content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--line)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--iris)]" />
            "Why Haji Murad" Section Content
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Modify main headline, description badge, 4 track record metrics, and 3 key feature points displayed on the Home page.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section Header Fields */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider">
            Main Headline & Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Badge Text */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Top Pill Badge Text *
              </label>
              <input
                type="text"
                name="badgeText"
                value={formData.badgeText}
                onChange={handleChange}
                placeholder=""
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Main Heading */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Main Section Heading *
              </label>
              <input
                type="text"
                name="heading"
                value={formData.heading}
                onChange={handleChange}
                placeholder=""
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Main Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Detailed Section Overview Paragraph *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder=""
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* 4 Track Record Metrics */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider">
            Track Record Statistics (Count-Up Numbers)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[var(--iris)]" />
                Years Experience
              </label>
              <input
                type="number"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                min={0}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Metric 2 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--iris)]" />
                Surgeries Count
              </label>
              <input
                type="number"
                name="successfulSurgeries"
                value={formData.successfulSurgeries}
                onChange={handleChange}
                min={0}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Metric 3 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[var(--iris)]" />
                Specialists Count
              </label>
              <input
                type="number"
                name="certifiedSpecialists"
                value={formData.certifiedSpecialists}
                onChange={handleChange}
                min={0}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Metric 4 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--iris)]" />
                Success Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="patientSuccessRate"
                value={formData.patientSuccessRate}
                onChange={handleChange}
                min={0}
                max={100}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-3 py-2.5 text-sm text-[#2B1F1A] font-bold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Hospital Highlights Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 pb-1">
            <div>
              <h3 className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider">
                Hospital Highlights & Feature Points ({formData.points.length})
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Add, edit, or remove key highlights displayed in the "Why Choose Us" section on the Home page.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleAddPoint}
              className="flex items-center gap-1.5 bg-[var(--iris)] hover:bg-[var(--ink)] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Highlight
            </motion.button>
          </div>

          <div className="space-y-4">
            {formData.points.map((pt, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[var(--fog)] border border-[var(--line)] space-y-3 relative group">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-[var(--iris)] uppercase tracking-widest block">
                    Highlight #{idx + 1}
                  </span>
                  {formData.points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-red-200"
                      title="Delete this highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block">
                    Highlight Title *
                  </label>
                  <input
                    type="text"
                    value={pt.title}
                    onChange={(e) => handlePointChange(idx, "title", e.target.value)}
                    placeholder=""
                    required
                    className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] rounded-xl px-4 py-2 text-xs text-[#2B1F1A] font-semibold focus:outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block">
                    Highlight Description *
                  </label>
                  <input
                    type="text"
                    value={pt.description}
                    onChange={(e) => handlePointChange(idx, "description", e.target.value)}
                    placeholder=""
                    required
                    className="w-full bg-white border border-[var(--line)] focus:border-[var(--iris)] rounded-xl px-4 py-2 text-xs text-[#2B1F1A] font-semibold focus:outline-none focus:ring-2"
                  />
                </div>

                {/* Highlight Icon Image Upload Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-[#2B1F1A] uppercase tracking-wider block">
                    Highlight Icon (Optional Image / Logo Upload)
                  </label>
                  <ImagePicker
                    value={pt.iconUrl || ""}
                    onChange={(newUrl) => handlePointChange(idx, "iconUrl", newUrl)}
                    label="Highlight Custom Icon Image"
                    cropSquare={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <AnimatePresence>
              {savedSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>"Why Choose Us" Content Saved & Live!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Content..." : "Save Changes"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
