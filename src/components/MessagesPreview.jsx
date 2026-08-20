"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Award, UserCheck, Building2, ArrowRight, Quote } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Noto_Nastaliq_Urdu } from "next/font/google";

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  fallback: ["serif", "system-ui"],
});

const DEFAULT_LATE_CHAIRMAN_URDU = `حاجی مراد ٹرسٹ آئی ہسپتال کے قیام کا بنیادی مقصد انسانیت کی خدمت اور قابلِ علاج اندھے پن کا خاتمہ ہے۔ 1980 سے ہم مریضوں کو جدید ترین سہولیات، عالمی معیار کے آپریشن اور مخلصانہ نگہداشت فراہم کر رہے ہیں۔`;

const DEFAULT_CHAIRMAN_URDU = `ہمارا عزم آنکھوں کی عالمی معیار کی دیکھ بھال ہر فرد تک پہنچانا ہے۔ حاجی مراد آئی ہسپتال جدید ترین فیمٹو لیزر، موتیابند سرجری اور جدید ڈائیگنوسٹکس کے ساتھ مریضوں کو بہترین اور باوقار علاج فراہم کر رہا ہے۔`;

const DEFAULT_ADMIN_URDU = `حاجی مراد ٹرسٹ آئی ہسپتال میں انتظامیہ کا اولین مقصد تمام مریضوں کو منظم، بروقت اور اعلیٰ ترین طبی سہولیات کی فراہمی کو یقینی بنانا ہے۔ ہم جدید ترین ڈائیگنوسٹک آلات اور اسٹیٹ آف دی آرٹ آپریشن تھیٹرز کے ذریعے شفاف خدمات فراہم کرتے ہیں۔`;

const TABS_CONFIG = [
  {
    id: "late-chairman",
    docId: "lateChairmanMessage",
    label: "Late Chairman's Message",
    badge: "Founding Vision",
    icon: Award,
    targetAnchor: "late-chairman-message",
    defaultName: "Haji Murad Ali (Late)",
    defaultTitle: "Founder & Late Chairman, Haji Murad Eye Hospital Trust",
    defaultImage: "/images/chairman.jpg",
    defaultText: DEFAULT_LATE_CHAIRMAN_URDU,
  },
  {
    id: "chairman",
    docId: "chairmanMessage",
    label: "Chairman's Message",
    badge: "Leadership Vision",
    icon: UserCheck,
    targetAnchor: "chairman-message",
    defaultName: "Dr. Zafar Iqbal",
    defaultTitle: "Chairman, Haji Murad Eye Hospital Trust",
    defaultImage: "/images/doctor-male-1.jpg",
    defaultText: DEFAULT_CHAIRMAN_URDU,
  },
  {
    id: "admin",
    docId: "adminsMessage",
    label: "Admin's Message",
    badge: "Management Vision",
    icon: Building2,
    targetAnchor: "admin-message",
    defaultName: "Hospital Administrator",
    defaultTitle: "Administrator, Haji Murad Eye Hospital Trust",
    defaultImage: "/images/admin-profile.jpg",
    defaultText: DEFAULT_ADMIN_URDU,
  },
];

function createExcerpt(text = "", maxSentences = 2) {
  if (!text) return "";
  const cleaned = text
    .replace(/^\s*(بسم\s*اللہ\s*الرحمٰن\s*الرحیم|بسم\s*الله\s*الرحمن\s*الرحيم|بسم\s*اللہ\s*الرحمن\s*الرحیم)/gi, "")
    .trim();

  const paragraphs = cleaned.split("\n\n").filter(Boolean);
  const firstPara = paragraphs[0] || cleaned;

  const sentences = firstPara.split(/(?<=[۔.!?])\s+/);
  if (sentences.length <= maxSentences) {
    return firstPara;
  }
  return sentences.slice(0, maxSentences).join(" ") + " ...";
}

export default function MessagesPreview() {
  const [activeTabId, setActiveTabId] = useState("late-chairman");
  const [messagesData, setMessagesData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedCount = 0;
    const unsubscribes = TABS_CONFIG.map((tab) => {
      return onSnapshot(
        doc(db, "siteContent", tab.docId),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMessagesData((prev) => ({
              ...prev,
              [tab.id]: {
                name: data.name || tab.defaultName,
                title: data.designation
                  ? data.designation.replace(/Haji Murad Trust Eye Hospital/g, "Haji Murad Eye Hospital Trust")
                  : tab.defaultTitle,
                imageUrl: data.imageUrl || tab.defaultImage,
                message: data.message || tab.defaultText,
                shortExcerpt: data.shortExcerpt || createExcerpt(data.message || tab.defaultText),
              },
            }));
          } else {
            setMessagesData((prev) => ({
              ...prev,
              [tab.id]: {
                name: tab.defaultName,
                title: tab.defaultTitle,
                imageUrl: tab.defaultImage,
                message: tab.defaultText,
                shortExcerpt: createExcerpt(tab.defaultText),
              },
            }));
          }
          loadedCount++;
          if (loadedCount >= TABS_CONFIG.length) setLoading(false);
        },
        (error) => {
          console.warn(`Firestore subscription warning for ${tab.docId}:`, error.message);
          setMessagesData((prev) => ({
            ...prev,
            [tab.id]: {
              name: tab.defaultName,
              title: tab.defaultTitle,
              imageUrl: tab.defaultImage,
              message: tab.defaultText,
              shortExcerpt: createExcerpt(tab.defaultText),
            },
          }));
          loadedCount++;
          if (loadedCount >= TABS_CONFIG.length) setLoading(false);
        }
      );
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const activeTabConfig =
    TABS_CONFIG.find((t) => t.id === activeTabId) || TABS_CONFIG[0];

  const activeMessage = messagesData[activeTabId] || {
    name: activeTabConfig.defaultName,
    title: activeTabConfig.defaultTitle,
    imageUrl: activeTabConfig.defaultImage,
    shortExcerpt: createExcerpt(activeTabConfig.defaultText),
  };

  return (
    <section id="messages-preview" className="py-14 lg:py-18 bg-[var(--fog)] relative overflow-hidden">
      {/* Soft ambient background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="mb-2">
              <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-4 py-1.5 rounded-full border border-[var(--line)] shadow-xs">
                Leadership Vision
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight my-2">
              Messages from Our Leadership
            </h2>
            <p className="text-sm sm:text-base text-[var(--slate)] font-medium leading-relaxed max-w-2xl mx-auto mt-2">
              Read the guiding vision and administrative commitment driving our high-precision ophthalmic care and humanitarian service.
            </p>
          </motion.div>
        </div>

        {/* 1. CENTERED COMPACT TABS ROW */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            {TABS_CONFIG.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = tab.id === activeTabId;

              return (
                <div key={tab.id} className="relative w-[calc(50%-6px)] sm:w-40 md:w-48 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group relative w-full py-6 sm:py-8 px-3 sm:px-4 rounded-[22px] min-h-[145px] sm:min-h-[165px] flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out cursor-pointer border overflow-hidden shadow-md ${isActive
                        ? "bg-[#1E1433] text-white border-[#1E1433] shadow-2xl scale-[1.03]"
                        : "bg-white text-[#2B1F1A] border-[var(--line)] hover:border-[#1E1433]/70 hover:shadow-lg"
                      }`}
                  >
                    {/* Smooth 0.5s Top-to-Bottom Wipe Reveal Background on Hover for Inactive Tabs */}
                    {!isActive && (
                      <div
                        className="absolute inset-x-0 top-0 h-0 group-hover:h-full bg-[#1E1433] transition-all duration-500 ease-in-out z-0 pointer-events-none"
                      />
                    )}

                    <div
                      className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors duration-500 ease-in-out ${isActive
                          ? "bg-white/15 text-white"
                          : "bg-[var(--fog)]/60 text-[var(--iris)] group-hover:bg-white/20 group-hover:text-white"
                        }`}
                    >
                      <IconComponent className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 stroke-[2.2]" />
                    </div>

                    <span
                      className={`relative z-10 text-xs sm:text-sm font-extrabold tracking-tight leading-snug transition-colors duration-500 ease-in-out ${isActive ? "text-white" : "text-[#2B1F1A] group-hover:text-white"
                        }`}
                    >
                      {tab.label}
                    </span>
                  </button>

                  {/* Speech Bubble Pointer Triangle */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                      className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#1E1433] z-30 pointer-events-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. CONTENT PANEL */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-28 shadow-xl border border-[var(--line)] w-full max-w-7xl mx-auto relative overflow-hidden z-10 -mt-16 sm:-mt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center"
            >
              {/* LEFT COLUMN: Profile Photo & Details */}
              <div className="lg:col-span-5 flex flex-col items-center text-center space-y-3.5 bg-[var(--fog)]/40 p-5 sm:p-6 rounded-2xl border border-[var(--line)]">
                <div className="relative w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[var(--iris)] shadow-md bg-[#0c4b8e]">
                  <Image
                    src={activeMessage.imageUrl}
                    alt={activeMessage.name}
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] tracking-tight">
                    {activeMessage.name}
                  </h3>
                  <p className="text-xs font-bold text-[var(--iris)] uppercase tracking-wide">
                    {activeMessage.title}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Excerpt Text */}
              <div className="lg:col-span-7 space-y-4 text-right" dir="rtl">
                <div className="flex items-center gap-2 text-[var(--iris)] flex-row-reverse">
                  <Quote className="w-6 h-6 rotate-180 opacity-70" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {activeTabConfig.badge}
                  </span>
                </div>

                <p
                  className={`${notoNastaliq.className} text-sm sm:text-base lg:text-lg font-normal leading-[2.1] text-slate-800 text-justify`}
                >
                  {activeMessage.shortExcerpt}
                </p>

                <div className="pt-3 text-left border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap" dir="ltr">
                  <span className="text-xs font-semibold text-slate-400 italic">
                    — {activeMessage.name}
                  </span>

                  <Link
                    href={`/about/hospital-message#${activeTabConfig.targetAnchor}`}
                    className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[var(--iris)] hover:text-[#E63946] transition-colors cursor-pointer group"
                  >
                    <span>View More</span>
                    <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
