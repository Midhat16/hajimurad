"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Phone, Mail, MapPin, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_SETTINGS = {
  uanNumber: "111 333 456",
  callNumber: "0332-4290724",
  helplineNumber: "0324-1111691",
  mainDeskNumber: "111 333 456",
  emergencyNumber: "0332-4290724",
  email: "info@hajimuradhospital.org",
  address: "Upper Chanab Canal Bank G.T Road Gujranwala",
};

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const snap = await getDoc(doc(db, "siteContent", "contactInfo"));
        if (snap.exists()) {
          const data = snap.data();
          const uanVal = data.uanNumber || data.mainDeskNumber || DEFAULT_SETTINGS.uanNumber;
          const callVal = data.callNumber || data.emergencyNumber || DEFAULT_SETTINGS.callNumber;
          const helpVal = data.helplineNumber || data.secondaryNumber || DEFAULT_SETTINGS.helplineNumber;
          setFormData({
            ...DEFAULT_SETTINGS,
            ...data,
            uanNumber: uanVal,
            callNumber: callVal,
            helplineNumber: helpVal,
            mainDeskNumber: uanVal,
            emergencyNumber: callVal,
          });
        }
      } catch (err) {
        console.error("Error fetching contact settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSavedSuccess(false);

    const uanVal = (formData.uanNumber || formData.mainDeskNumber || "").trim();
    const callVal = (formData.callNumber || formData.emergencyNumber || "").trim();
    const helpVal = (formData.helplineNumber || formData.secondaryNumber || "").trim();

    if (!uanVal || !callVal || !formData.email.trim() || !formData.address.trim()) {
      setError("All primary contact info fields are required.");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "contactInfo"), {
        uanNumber: uanVal,
        mainDeskNumber: uanVal,
        callNumber: callVal,
        emergencyNumber: callVal,
        helplineNumber: helpVal,
        secondaryNumber: helpVal,
        email: formData.email.trim(),
        address: formData.address.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save contact settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#0B3D5C]">Loading Site Contact Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#D5E5DD] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#3E8E6E]" />
            Site Contact Settings
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-0.5">
            Manage UAN, Call # line, Helpline/Mobile #, email, and clinic location displayed across website Footer and Contact page.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-sm space-y-6">
        
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* UAN Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#3E8E6E]" />
              UAN Number *
            </label>
            <input
              type="text"
              name="uanNumber"
              value={formData.uanNumber || ""}
              onChange={handleChange}
              placeholder="e.g. 111 333 456"
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Call # Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              Call # *
            </label>
            <input
              type="text"
              name="callNumber"
              value={formData.callNumber || ""}
              onChange={handleChange}
              placeholder="e.g. 0332-4290724"
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#3E8E6E]" />
              Official Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=""
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3E8E6E]" />
              Clinic Physical Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              placeholder=""
              required
              className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl px-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
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
                  <span>Settings Saved Successfully! Live on site now.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
