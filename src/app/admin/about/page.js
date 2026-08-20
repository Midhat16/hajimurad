"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Info, CheckCircle2, AlertCircle, UserCheck, Building2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImagePicker from "@/components/admin/ImagePicker";

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    mission: "",
    values: "",
  });

  const [lateChairmanData, setLateChairmanData] = useState({
    name: "Haji Murad Ali (Late)",
    designation: "Founder & Late Chairman, Haji Murad Eye Hospital Trust",
    message: "",
    imageUrl: "/images/chairman.jpg",
  });

  const [chairmanData, setChairmanData] = useState({
    name: "Dr. Zafar Iqbal",
    designation: "Chairman, Haji Murad Eye Hospital Trust",
    message: "",
    imageUrl: "/images/doctor-male-1.jpg",
  });

  const [adminData, setAdminData] = useState({
    name: "Hospital Administrator",
    designation: "Administrator, Haji Murad Eye Hospital Trust",
    message: "",
    imageUrl: "/images/admin-profile.jpg",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLateChairman, setIsSavingLateChairman] = useState(false);
  const [isSavingChairman, setIsSavingChairman] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedLateChairmanSuccess, setSavedLateChairmanSuccess] = useState(false);
  const [savedChairmanSuccess, setSavedChairmanSuccess] = useState(false);
  const [savedAdminSuccess, setSavedAdminSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAllContent() {
      try {
        // 1. Fetch About content
        const aboutSnap = await getDoc(doc(db, "siteContent", "about"));
        if (aboutSnap.exists()) {
          const data = aboutSnap.data();
          setFormData({
            title: data.title || "",
            story: data.story || "",
            mission: data.mission || "",
            values: data.values || "",
          });
        } else {
          setFormData({
            title: "Pioneering Vision Restoration for Over 3 Decades",
            story:
              "Founded with a mission to eliminate preventable blindness, Haji Murad Eye Hospital has grown from a humble specialized outpatient clinic into a leading regional ophthalmic center of excellence. We combine compassionate care with modern laser technologies to transform lives.",
            mission:
              "To deliver international gold-standard eye surgical care, accessible vision screening, and pioneering laser treatment to every patient with surgical excellence and warmth.",
            values:
              "Uncompromising Surgical Safety, Patient-Centric Compassion, Continuous Technology Innovation, Ethical Transparent Practice",
          });
        }

        // 2. Fetch Late Chairman Message content
        const lateSnap = await getDoc(doc(db, "siteContent", "lateChairmanMessage"));
        if (lateSnap.exists()) {
          const lData = lateSnap.data();
          setLateChairmanData({
            name: lData.name || "Haji Murad Ali (Late)",
            designation: lData.designation ? lData.designation.replace(/Haji Murad Trust Eye Hospital/g, "Haji Murad Eye Hospital Trust") : "Founder & Late Chairman, Haji Murad Eye Hospital Trust",
            message: lData.message || "",
            imageUrl: lData.imageUrl || "/images/chairman.jpg",
          });
        }

        // 3. Fetch Current Chairman Message content
        const chairmanSnap = await getDoc(doc(db, "siteContent", "chairmanMessage"));
        if (chairmanSnap.exists()) {
          const cData = chairmanSnap.data();
          setChairmanData({
            name: cData.name || "Dr. Zafar Iqbal",
            designation: cData.designation ? cData.designation.replace(/Haji Murad Trust Eye Hospital/g, "Haji Murad Eye Hospital Trust") : "Chairman, Haji Murad Eye Hospital Trust",
            message: cData.message || "",
            imageUrl: cData.imageUrl || "/images/doctor-male-1.jpg",
          });
        }

        // 4. Fetch Admin Message content
        const adminSnap = await getDoc(doc(db, "siteContent", "adminsMessage"));
        if (adminSnap.exists()) {
          const aData = adminSnap.data();
          setAdminData({
            name: aData.name || "Hospital Administrator",
            designation: aData.designation ? aData.designation.replace(/Haji Murad Trust Eye Hospital/g, "Haji Murad Eye Hospital Trust") : "Administrator, Haji Murad Eye Hospital Trust",
            message: aData.message || "",
            imageUrl: aData.imageUrl || "/images/admin-profile.jpg",
          });
        }
      } catch (err) {
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllContent();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLateChairmanChange = (e) => {
    const { name, value } = e.target;
    setLateChairmanData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChairmanChange = (e) => {
    const { name, value } = e.target;
    setChairmanData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAbout = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "siteContent", "about"),
        {
          ...formData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save About section:", err);
      setError("Failed to save About changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitLateChairman = async (e) => {
    e.preventDefault();
    setError("");
    setIsSavingLateChairman(true);
    try {
      await setDoc(
        doc(db, "siteContent", "lateChairmanMessage"),
        {
          ...lateChairmanData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedLateChairmanSuccess(true);
      setTimeout(() => setSavedLateChairmanSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save Late Chairman Message:", err);
      setError("Failed to save Late Chairman Message changes.");
    } finally {
      setIsSavingLateChairman(false);
    }
  };

  const handleSubmitChairman = async (e) => {
    e.preventDefault();
    setError("");
    setIsSavingChairman(true);
    try {
      await setDoc(
        doc(db, "siteContent", "chairmanMessage"),
        {
          ...chairmanData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedChairmanSuccess(true);
      setTimeout(() => setSavedChairmanSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save Chairman Message:", err);
      setError("Failed to save Chairman Message changes.");
    } finally {
      setIsSavingChairman(false);
    }
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSavingAdmin(true);
    try {
      await setDoc(
        doc(db, "siteContent", "adminsMessage"),
        {
          ...adminData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedAdminSuccess(true);
      setTimeout(() => setSavedAdminSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save Admin Message:", err);
      setError("Failed to save Admin Message changes.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading Content Management...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="border-b border-[var(--line)] pb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Site Content Editor
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            About & Leadership Messages Settings
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage hospital legacy, mission statement, Late Chairman, Current Chairman, and Admin Messages.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. SECTION: Main About Page Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--fog)] text-[var(--iris)] flex items-center justify-center font-bold">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2B1F1A]">
                About Hospital Main Content
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Headline, history story, mission statement, and core values.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Saved Live!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmitAbout} className="space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Headline Title *
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

          {/* Story */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Hospital Legacy & History Story
            </label>
            <textarea
              name="story"
              value={formData.story}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* Mission */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Hospital Mission Statement
            </label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              rows={3}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* Values */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Core Values (Comma Separated)
            </label>
            <input
              type="text"
              name="values"
              value={formData.values}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-[var(--ink)] text-white hover:bg-[var(--iris-dark)] px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving About Content..." : "Save About Content"}
            </button>
          </div>
        </form>
      </div>

      {/* 2. SECTION: Late Chairman's Message Editor */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2B1F1A]">
                Late Chairman's Message Settings
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Edit Founder & Late Chairman name, designation, photo, and official statement.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {savedLateChairmanSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Saved Live!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmitLateChairman} className="space-y-6">
          {/* Photo Upload / Selection */}
          <div className="bg-[var(--fog)] p-4 rounded-2xl border border-[var(--line)]">
            <ImagePicker
              value={lateChairmanData.imageUrl}
              onChange={(url) => setLateChairmanData((prev) => ({ ...prev, imageUrl: url }))}
              label="Late Chairman Photo / Picture"
              cropSquare={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Late Chairman Name *
              </label>
              <input
                type="text"
                name="name"
                value={lateChairmanData.name}
                onChange={handleLateChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={lateChairmanData.designation}
                onChange={handleLateChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Late Chairman Message Body (Urdu / English) *
            </label>
            <textarea
              name="message"
              value={lateChairmanData.message}
              onChange={handleLateChairmanChange}
              required
              rows={12}
              placeholder="Enter official statement from late chairman..."
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-y leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingLateChairman}
              className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingLateChairman ? "Saving Message..." : "Save Late Chairman's Message"}
            </button>
          </div>
        </form>
      </div>

      {/* 3. SECTION: Current Chairman's Message Editor */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2B1F1A]">
                Current Chairman's Message Settings
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Edit Current Chairman name, designation, photo, and official statement.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {savedChairmanSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Saved Live!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmitChairman} className="space-y-6">
          {/* Photo Upload / Selection */}
          <div className="bg-[var(--fog)] p-4 rounded-2xl border border-[var(--line)]">
            <ImagePicker
              value={chairmanData.imageUrl}
              onChange={(url) => setChairmanData((prev) => ({ ...prev, imageUrl: url }))}
              label="Chairman Photo / Picture"
              cropSquare={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Chairman Name *
              </label>
              <input
                type="text"
                name="name"
                value={chairmanData.name}
                onChange={handleChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={chairmanData.designation}
                onChange={handleChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Chairman Message Body (Urdu / English) *
            </label>
            <textarea
              name="message"
              value={chairmanData.message}
              onChange={handleChairmanChange}
              required
              rows={14}
              placeholder="Enter official statement from current chairman..."
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-y leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingChairman}
              className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingChairman ? "Saving Message..." : "Save Chairman's Message"}
            </button>
          </div>
        </form>
      </div>

      {/* 4. SECTION: Admin's Message Editor */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#2B1F1A]">
                Admin's Message Settings
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Edit Administrator name, designation, photo, and official statement.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {savedAdminSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Saved Live!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmitAdmin} className="space-y-6">
          {/* Photo Upload / Selection */}
          <div className="bg-[var(--fog)] p-4 rounded-2xl border border-[var(--line)]">
            <ImagePicker
              value={adminData.imageUrl}
              onChange={(url) => setAdminData((prev) => ({ ...prev, imageUrl: url }))}
              label="Administrator Photo / Picture"
              cropSquare={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Administrator Name *
              </label>
              <input
                type="text"
                name="name"
                value={adminData.name}
                onChange={handleAdminChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={adminData.designation}
                onChange={handleAdminChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Admin Official Message Body (Urdu / English) *
            </label>
            <textarea
              name="message"
              value={adminData.message}
              onChange={handleAdminChange}
              required
              rows={12}
              placeholder="Enter official statement from hospital administrator..."
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-y leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingAdmin}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingAdmin ? "Saving Admin Message..." : "Save Admin's Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
