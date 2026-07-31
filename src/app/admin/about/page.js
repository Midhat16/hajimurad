"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    mission: "",
    values: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAboutContent() {
      try {
        const snap = await getDoc(doc(db, "siteContent", "about"));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            title: data.title || "",
            story: data.story || "",
            mission: data.mission || "",
            values: data.values || "",
          });
        } else {
          // Pre-fill defaults if doc doesn't exist yet
          setFormData({
            title: "Pioneering Vision Restoration for Over 3 Decades",
            story: "Founded with a mission to eliminate preventable blindness, Haji Murad Eye Hospital has grown from a humble specialized outpatient clinic into a world-renowned ophthalmic center of excellence. We combine compassionate care with cutting-edge laser technologies to transform lives.",
            mission: "To deliver international gold-standard eye surgical care, accessible vision screening, and pioneering laser treatment to every patient with clinical excellence and warmth.",
            values: "Uncompromising Surgical Safety, Patient-Centric Compassion, Continuous Technology Innovation, Ethical Transparent Practice",
          });
        }
      } catch (err) {
        console.error("Error fetching about content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "about"), {
        ...formData,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save About section:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#0B3D5C]">Loading About Content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#D5E5DD] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
            About Section Content
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
            Edit hospital history, mission statement, and core values displayed on the main page.
          </p>
        </div>

        <AnimatePresence>
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Changes Live on Site!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-sm space-y-6">
        
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Headline Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder=""
            className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
          />
        </div>

        {/* Story */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Hospital Legacy & History Story
          </label>
          <textarea
            name="story"
            value={formData.story}
            onChange={handleChange}
            rows={5}
            placeholder=""
            className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Mission */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Clinical Mission Statement
          </label>
          <textarea
            name="mission"
            value={formData.mission}
            onChange={handleChange}
            rows={4}
            placeholder=""
            className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Values */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
            Core Values (Comma Separated)
          </label>
          <input
            type="text"
            name="values"
            value={formData.values}
            onChange={handleChange}
            placeholder=""
            className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
          />
          <p className="text-[11px] text-slate-400 font-medium">
            Separate core values with commas. They will be rendered as highlight checkmark pills.
          </p>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-7 py-3 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
