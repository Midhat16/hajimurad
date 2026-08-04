"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Info, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_FULL_MESSAGE = `Right from the very childhood, whenever I happened to pass near some welfare institution, I was inspired by an intense desire to pray to God to enable me to build such an institution as may prove memorable till eternity. I am grateful to Almighty Allah from the core of my heart for the fulfillment of my desire i.e., the completion of a welfare eye hospital.

I do not find words to thank Almighty Allah, who enabled me to find and purchase the best possible piece of land for the construction of the hospital. I visited different places and saw many pieces of land but none could satisfy my aesthetic sense. While going and coming from Lahore and crossing the canal bridge, I prayed to Almighty Allah to enable me to purchase it.

One day, while I was sitting in my factory, suddenly a property dealer rang me up to inform that a suitable piece of land, adjacent to the canal, was available for purchase. I left all business affairs and rang up Late Haji Manzoor Hussain, a close friend of mine, to accompany me to the property dealer.

Accompanying him, I contacted the owner of the land. The deal was settled there with some advance. This is how the seed for the construction of the hospital was sown. Then I called a meeting of my brothers, members of my family and friends, and placed before them the plan for the construction of the hospital. I told them that I wanted to build a centrally air conditioned Eye Hospital, equipped with the latest surgical instruments and other equipment for the treatment of eye disease. The basic object of this hospital would be to treat the poor patients. It would be a hospital where the poor patients will not only be operated upon and treated free but medicine will also be provided to them free of all cost. It would be a hospital where no preference would be shown to any patient whatever be his social status. It would be a hospital where no employee would receive any bribe or tip from the patients. In this hospital even the trustees and their relatives would receive the same treatment as an ordinary patient, on one's turn and absolutely no preference would be shown to them. In this hospital meticulous arrangement would be made for maintaining cleanliness round the clock.

All the people gathered there, not only appreciated the plan whole heartedly but also promised and assured me of their full and complete co-operation and help.

On Feb, 28, 1980 the foundation stone of the hospital was laid by Maryam Bibi, the respectable mother of Haji Murad Ali. Thereafter, the trustees worked day and night to complete the building and by the grace of Almighty Allah the Opening Ceremony of the hospital was performed by Maryam Bibi (May her soul rest in eternal peace) on 1st September, 1982.

All the members of family and trustees extended their whole hearted co-operation in the construction of the building of the hospital. However, my special thanks are due to Mr. Muhammad Saleem and Mr. Muhammad Naseem who were always in the forefront to complete this noble task. After the Opening Ceremony of the hospital Haji Muhammad Amin Shaikh, the ex-president of the Chamber of Commerce and Industries Gujranwala, was appointed General Secretary of the hospital who not only contributed generously on the financial side but also took active and keen interest in the administration of the hospital. Later on, when the construction of residential flats for the doctors became necessary, a large number of friends including Sh. Muhammad Younas, Haji Muhammad Amin, Haji Muhammad Saeed and Seth Siddique Bahrain Wale played a prominent role to accomplish this project.

By the grace of God, the hospital began to treat a large number of patients from the very first day. This number went on increasing day by day. It is a matter of great satisfaction for me that God Almighty has fulfilled my cherished dream and the hospital is performing the function that it was constructed for.

I am fully satisfied with the working of the hospital. The whole staff is hardworking, honest and experienced. These qualities of the staff have enhanced the reputation of the hospital. Every patient who comes for the treatment leaves the hospital satisfied and contented. This working and reputation of the hospital is proving to be the greatest spiritual treasure for me and the trustees of the hospital. I pray from the core of my heart that this hospital may progress and prosper forever and more and more patients should get benefit from it.

I do not find words to express my deepest sense of gratitude and thanks to Almighty Allah for granting me the strength and courage to complete this gigantic task for the service of the suffering humanity.

While concluding, I would love to record my deepest sense of appreciation and gratitude for all those who joined hands in this noble cause and extended their co-operation for the completion of this hospital.`;

export default function AdminAboutPage() {
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    mission: "",
    values: "",
  });

  const [chairmanData, setChairmanData] = useState({
    name: "Haji Murad Ali (Late)",
    designation: "Chairman, Haji Murad Trust Eye Hospital",
    message: DEFAULT_FULL_MESSAGE,
    imageUrl: "/images/chairman.jpg",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingChairman, setIsSavingChairman] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedChairmanSuccess, setSavedChairmanSuccess] = useState(false);
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
              "Founded with a mission to eliminate preventable blindness, Haji Murad Eye Hospital has grown from a humble specialized outpatient clinic into a world-renowned ophthalmic center of excellence. We combine compassionate care with cutting-edge laser technologies to transform lives.",
            mission:
              "To deliver international gold-standard eye surgical care, accessible vision screening, and pioneering laser treatment to every patient with surgical excellence and warmth.",
            values:
              "Uncompromising Surgical Safety, Patient-Centric Compassion, Continuous Technology Innovation, Ethical Transparent Practice",
          });
        }

        // 2. Fetch Chairman Message content
        const chairmanSnap = await getDoc(doc(db, "siteContent", "chairmanMessage"));
        if (chairmanSnap.exists()) {
          const cData = chairmanSnap.data();
          setChairmanData({
            name: cData.name || "Haji Murad Ali (Late)",
            designation: cData.designation || "Chairman, Haji Murad Trust Eye Hospital",
            message: cData.message || DEFAULT_FULL_MESSAGE,
            imageUrl: cData.imageUrl || "/images/chairman.jpg",
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

  const handleChairmanChange = (e) => {
    const { name, value } = e.target;
    setChairmanData((prev) => ({ ...prev, [name]: value }));
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-[var(--ink)]">Loading Content Management...</p>
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
          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mt-1">
            About & Chairman Message Settings
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Manage hospital legacy, mission statement, and the official Chairman's Message page.
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
              <h2 className="text-base font-extrabold text-[var(--ink)]">
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
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Headline Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          {/* Story */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Hospital Legacy & History Story
            </label>
            <textarea
              name="story"
              value={formData.story}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* Mission */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Hospital Mission Statement
            </label>
            <textarea
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              rows={3}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
            />
          </div>

          {/* Values */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Core Values (Comma Separated)
            </label>
            <input
              type="text"
              name="values"
              value={formData.values}
              onChange={handleChange}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
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

      {/* 2. SECTION: Chairman's Message Editor */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--ink)]">
                Chairman's Message Settings
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Edit Chairman name, designation, and official statement shown on /about/chairman-message.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Chairman Name *
              </label>
              <input
                type="text"
                name="name"
                value={chairmanData.name}
                onChange={handleChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Designation *
              </label>
              <input
                type="text"
                name="designation"
                value={chairmanData.designation}
                onChange={handleChairmanChange}
                required
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Chairman Official Message Body *
            </label>
            <textarea
              name="message"
              value={chairmanData.message}
              onChange={handleChairmanChange}
              required
              rows={14}
              placeholder="Enter official statement from the chairman..."
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[var(--ink)] font-semibold focus:outline-none focus:ring-4 transition-all resize-y leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingChairman}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingChairman ? "Saving Message..." : "Save Chairman's Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
