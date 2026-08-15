"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Phone, Mail, MapPin, AlertCircle, CheckCircle2, Shield, Building2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImagePicker from "@/components/admin/ImagePicker";

const DEFAULT_SETTINGS = {
  uanNumber: "111 333 456",
  callNumber: "0332-4290724",
  helplineNumber: "0324-1111691",
  mainDeskNumber: "111 333 456",
  emergencyNumber: "0332-4290724",
  email: "info@hajimuradhospital.org",
  address: "Upper Chanab Canal Bank G.T Road Gujranwala",
  uanHelplineTitle: "24/7 UAN Helpline",
  uanHelplineSubtitle: "Need assistance? Our team is available 24/7.",
  uanHelplineImage: "/images/247-helpline.svg",
};

const DEFAULT_PROFILE = {
  hospitalName: "Haji Murad Trust Eye Hospital",
  logoUrl: "/images/logo.png",
};

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Contact Info States
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  // Profile States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        // Fetch Contact Info
        const contactSnap = await getDoc(doc(db, "siteContent", "contactInfo"));
        if (contactSnap.exists()) {
          const data = contactSnap.data();
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
            uanHelplineTitle: data.uanHelplineTitle || DEFAULT_SETTINGS.uanHelplineTitle,
            uanHelplineSubtitle: data.uanHelplineSubtitle || DEFAULT_SETTINGS.uanHelplineSubtitle,
            uanHelplineImage: data.uanHelplineImage || DEFAULT_SETTINGS.uanHelplineImage,
          });
        }

        // Fetch Hospital Profile
        const profileSnap = await getDoc(doc(db, "siteContent", "profile"));
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setProfileData({
            hospitalName: pData.hospitalName || DEFAULT_PROFILE.hospitalName,
            logoUrl: pData.logoUrl || DEFAULT_PROFILE.logoUrl,
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!profileData.hospitalName.trim()) {
      setProfileError("Hospital name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await setDoc(
        doc(db, "siteContent", "profile"),
        {
          hospitalName: profileData.hospitalName.trim(),
          logoUrl: profileData.logoUrl || DEFAULT_PROFILE.logoUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err) {
      console.error("Error saving profile settings:", err);
      setProfileError("Failed to save profile settings. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
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
        uanHelplineTitle: (formData.uanHelplineTitle || DEFAULT_SETTINGS.uanHelplineTitle).trim(),
        uanHelplineSubtitle: (formData.uanHelplineSubtitle || DEFAULT_SETTINGS.uanHelplineSubtitle).trim(),
        uanHelplineImage: formData.uanHelplineImage || DEFAULT_SETTINGS.uanHelplineImage,
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
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[#2B1F1A]">Loading Site Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-[var(--line)] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--iris)]" />
            Site Settings & Configuration
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage Hospital Profile (Logo & Name) and Contact Information displayed across website & dashboards.
          </p>
        </div>
      </div>

      {/* SECTION 1: Hospital Profile Settings */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--fog)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--fog)] text-[var(--iris)] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2B1F1A]">Hospital Branding & Profile</h2>
            <p className="text-xs font-semibold text-[var(--slate)]">Update hospital logo image and official name dynamically.</p>
          </div>
        </div>

        {profileError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Hospital Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[var(--iris)]" />
              Hospital Name *
            </label>
            <input
              type="text"
              name="hospitalName"
              value={profileData.hospitalName}
              onChange={handleProfileChange}
              placeholder=""
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Hospital Logo Image Picker */}
          <ImagePicker
            label="Hospital Logo Image *"
            value={profileData.logoUrl}
            onChange={(url) => setProfileData((prev) => ({ ...prev, logoUrl: url }))}
          />
        </div>

        {/* Profile Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <AnimatePresence>
              {profileSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Hospital Profile Updated Successfully! Dynamic on site now.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSavingProfile ? "Saving Profile..." : "Save Hospital Profile"}
          </motion.button>
        </div>
      </form>

      {/* SECTION 2: Contact Info Settings */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--fog)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--fog)] text-[var(--iris)] flex items-center justify-center font-bold">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2B1F1A]">Site Contact Information</h2>
            <p className="text-xs font-semibold text-[var(--slate)]">Manage UAN, helpline numbers, email, and physical clinic address.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* UAN Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[var(--iris)]" />
              UAN Number *
            </label>
            <input
              type="text"
              name="uanNumber"
              value={formData.uanNumber || ""}
              onChange={handleChange}
              placeholder="UAN helpline number"
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Call # Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              Call # *
            </label>
            <input
              type="text"
              name="callNumber"
              value={formData.callNumber || ""}
              onChange={handleChange}
              placeholder="03XX-XXXXXXX"
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[var(--iris)]" />
              Official Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=""
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--iris)]" />
              Clinic Physical Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              placeholder=""
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* 24/7 UAN HELPLINE BANNER SETTINGS */}
          <div className="md:col-span-2 pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                Home Page Section
              </span>
              <h3 className="text-sm font-extrabold text-[#2B1F1A] uppercase tracking-wider">
                24/7 UAN Helpline Banner Controls
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                  Helpline Section Title
                </label>
                <input
                  type="text"
                  name="uanHelplineTitle"
                  value={formData.uanHelplineTitle || ""}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-[var(--fog)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-xs text-[#2B1F1A] font-semibold focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
                  Helpline Subtitle Text
                </label>
                <input
                  type="text"
                  name="uanHelplineSubtitle"
                  value={formData.uanHelplineSubtitle || ""}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full bg-[var(--fog)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-xs text-[#2B1F1A] font-semibold focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              <div className="md:col-span-2">
                <ImagePicker
                  label="24/7 Clock / Helpline Image *"
                  value={formData.uanHelplineImage || "/images/247-helpline.svg"}
                  onChange={(url) => setFormData((prev) => ({ ...prev, uanHelplineImage: url }))}
                  cropSquare={false}
                />
              </div>
            </div>
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
                  <span>Contact Info Saved Successfully! Live on site now.</span>
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
            {isSaving ? "Saving Contact Info..." : "Save Contact Info"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

