"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserCheck, ShieldCheck, HeartPulse, Award, Building2, User, Sparkles, ChevronRight, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Noto_Nastaliq_Urdu } from "next/font/google";

const notoNastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const DEFAULT_LATE_CHAIRMAN_URDU = `حاجی مراد ٹرسٹ آئی ہسپتال کے قیام کا بنیادی مقصد انسانیت کی خدمت اور قابلِ علاج اندھے پن کا خاتمہ ہے۔ 1980 سے ہم مریضوں کو جدید ترین سہولیات، عالمی معیار کے آپریشن اور مخلصانہ نگہداشت فراہم کر رہے ہیں۔

ہمارا منشور ہے کہ کوئی بھی شخص مالی تنگدستی کی وجہ سے آنکھوں کے علاج اور بینائی کی نعمت سے محروم نہ رہے۔ ان شاء اللہ یہ ہسپتال آنے والے وقت میں مزید جدید ٹیکنالوجی اور اعلیٰ ترین معیارِ صحت کے ساتھ عوام کی خدمت جاری رکھے گا۔`;

const DEFAULT_CHAIRMAN_URDU = `بسم اللہ الرحمٰن الرحیم

ہمارا عزم آنکھوں کی عالمی معیار کی دیکھ بھال ہر فرد تک پہنچانا ہے۔ حاجی مراد آئی ہسپتال جدید ترین فیمٹو لیزر، موتیابند سرجری اور جدید ڈائیگنوسٹکس کے ساتھ مریضوں کو بہترین اور باوقار علاج فراہم کر رہا ہے۔

ہم جدید طب اور ہمدردانہ دیکھ بھال کا حسین امتزاج پیش کرتے ہیں تاکہ ہر مریض بینائی کی نعمت سے دوبارہ لطف اندوز ہو سکے۔`;

const DEFAULT_ADMIN_URDU = `بسم اللہ الرحمٰن الرحیم

حاجی مراد ٹرسٹ آئی ہسپتال میں انتظامیہ کا اولین مقصد تمام مریضوں کو منظم، بروقت اور اعلیٰ ترین طبی سہولیات کی فراہمی کو یقینی بنانا ہے۔

ہم جدید ترین ڈائیگنوسٹک آلات، اسٹیٹ آف دی آرٹ آپریشن تھیٹرز اور تربیت یافتہ پیرامیڈیکل سٹاف کے ذریعے انتظامی امور کو شفاف اور موثر بناتے ہیں۔ ہماری ترجیح مریضوں کا اطمینان، باوقار دیکھ بھال اور بغیر کسی تاخیر کے علاج کی سہولت فراہم کرنا ہے۔`;

const MENU_ITEMS = [
  { id: "late-chairman-message", label: "Late Chairman's Message", badge: "Founding Vision", icon: UserCheck },
  { id: "chairman-message", label: "Chairman's Message", badge: "Leadership Vision", icon: Award },
  { id: "admin-message", label: "Admin's Message", badge: "Management Vision", icon: Building2 },
];

export default function HospitalMessagePage() {
  const [activeSection, setActiveSection] = useState("late-chairman-message");
  const [loading, setLoading] = useState(true);

  const [lateChairmanData, setLateChairmanData] = useState(null);
  const [chairmanData, setChairmanData] = useState(null);
  const [adminData, setAdminData] = useState(null);

  // Subscribe to Firestore content updates
  useEffect(() => {
    let count = 0;
    const markLoaded = () => {
      count++;
      if (count >= 3) setLoading(false);
    };

    // 1. Late Chairman Message (Haji Murad Ali Late)
    const unsubLateChairman = onSnapshot(
      doc(db, "siteContent", "lateChairmanMessage"),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLateChairmanData({
            name: d.name || "Haji Murad Ali (Late)",
            designation: d.designation || "Founder & Late Chairman, Haji Murad Trust Eye Hospital",
            message: d.message || DEFAULT_LATE_CHAIRMAN_URDU,
            imageUrl: d.imageUrl || "/images/chairman.jpg",
          });
        } else {
          setLateChairmanData({
            name: "Haji Murad Ali (Late)",
            designation: "Founder & Late Chairman, Haji Murad Trust Eye Hospital",
            message: DEFAULT_LATE_CHAIRMAN_URDU,
            imageUrl: "/images/chairman.jpg",
          });
        }
        markLoaded();
      },
      () => markLoaded()
    );

    // 2. Chairman Message (Current Chairman)
    const unsubChairman = onSnapshot(
      doc(db, "siteContent", "chairmanMessage"),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setChairmanData({
            name: d.name || "Dr. Zafar Iqbal",
            designation: d.designation || "Chairman, Haji Murad Trust Eye Hospital",
            message: d.message || DEFAULT_CHAIRMAN_URDU,
            imageUrl: d.imageUrl || "/images/doctor-male-1.jpg",
          });
        } else {
          setChairmanData({
            name: "Dr. Zafar Iqbal",
            designation: "Chairman, Haji Murad Trust Eye Hospital",
            message: DEFAULT_CHAIRMAN_URDU,
            imageUrl: "/images/doctor-male-1.jpg",
          });
        }
        markLoaded();
      },
      () => markLoaded()
    );

    // 3. Admin Message
    const unsubAdmin = onSnapshot(
      doc(db, "siteContent", "adminsMessage"),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setAdminData({
            name: d.name || "Hospital Administrator",
            designation: d.designation || "Administrator, Haji Murad Trust Eye Hospital",
            message: d.message || DEFAULT_ADMIN_URDU,
            imageUrl: d.imageUrl || "/images/admin-profile.jpg",
          });
        } else {
          setAdminData({
            name: "Hospital Administrator",
            designation: "Administrator, Haji Murad Trust Eye Hospital",
            message: DEFAULT_ADMIN_URDU,
            imageUrl: "/images/admin-profile.jpg",
          });
        }
        markLoaded();
      },
      () => markLoaded()
    );

    return () => {
      unsubLateChairman();
      unsubChairman();
      unsubAdmin();
    };
  }, []);

  // IntersectionObserver to auto-update active sidebar link on scroll
  useEffect(() => {
    const handleObserver = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.1,
    });

    MENU_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler
  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Helper to parse Bismillah header
  const parseUrduText = (rawMessage) => {
    const bismillahRegex = /^\s*(بسم\s*اللہ\s*الرحمٰن\s*الرحیم|بسم\s*الله\s*الرحمن\s*الرحيم|بسم\s*اللہ\s*الرحمن\s*الرحیم)/i;
    let bismillahHeader = "بسم اللہ الرحمٰن الرحیم";
    let paragraphs = rawMessage;

    if (bismillahRegex.test(rawMessage)) {
      const firstLineEnd = rawMessage.indexOf("\n");
      if (firstLineEnd !== -1) {
        bismillahHeader = rawMessage.slice(0, firstLineEnd).trim();
        paragraphs = rawMessage.slice(firstLineEnd).trim();
      } else {
        bismillahHeader = rawMessage.trim();
        paragraphs = "";
      }
    }
    return { bismillahHeader, paragraphs };
  };

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-24 font-sans">
      {/* Top Hero Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <UserCheck className="w-4 h-4" /> Hospital Messages
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Leadership & Management Vision
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            The founding values, ongoing medical guidance, and administrative commitment at Haji Murad Trust Eye Hospital.
          </p>
        </div>
      </section>

      {/* Mobile Horizontal Section Bar (Flush with Navbar, 0px gap) */}
      <div className="lg:hidden sticky top-[56px] sm:top-[68px] z-40 bg-[var(--fog)] py-3 px-4 border-b border-[var(--line)] shadow-sm mb-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md scale-105"
                    : "bg-white text-[#2B1F1A] border-[var(--line)] hover:bg-[#F7F3EA]"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT STICKY SIDEBAR (DESKTOP) ================= */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 z-20 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[var(--line)] shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--line)]">
                <Sparkles className="w-4 h-4 text-[var(--iris)]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#2B1F1A]">
                  Messages Navigation
                </h3>
              </div>

              <div className="space-y-2">
                {MENU_ITEMS.map((item) => {
                  const IconComp = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-extrabold text-left transition-all duration-300 cursor-pointer border ${
                        isActive
                          ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md translate-x-1"
                          : "bg-white text-[#2B1F1A] border-[var(--line)] hover:border-[var(--iris)]/40 hover:bg-[#F7F3EA]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isActive ? "bg-white/20 text-white" : "bg-[var(--fog)] text-[var(--iris)]"
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block">{item.label}</span>
                          <span className={`text-[10px] font-bold block ${isActive ? "text-white/80" : "text-slate-400"}`}>
                            {item.badge}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "translate-x-1" : "opacity-40"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ================= RIGHT MAIN CONTENT AREA (3 SECTIONS IN ONE PAGE) ================= */}
          <div className="lg:col-span-8 space-y-12">
            {loading || !lateChairmanData || !chairmanData || !adminData ? (
              <div className="bg-white rounded-3xl p-8 border border-[var(--line)] shadow-xl space-y-6 animate-pulse">
                <div className="h-8 bg-slate-200 rounded-xl w-1/3 mx-auto" />
                <div className="h-48 w-44 bg-slate-200 rounded-2xl mx-auto" />
                <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto" />
                <div className="h-4 bg-slate-200 rounded-lg w-1/3 mx-auto" />
                <div className="space-y-3 pt-6">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-5/6 mx-auto" />
                  <div className="h-4 bg-slate-200 rounded w-4/6 mx-auto" />
                </div>
              </div>
            ) : (
              <>
            {/* ---------------- SECTION 1: LATE CHAIRMAN'S MESSAGE ---------------- */}
            <motion.section
              id="late-chairman-message"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--line)] shadow-xl relative overflow-hidden space-y-8 scroll-mt-28"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-amber-700" /> Founding Vision
                </span>
              </div>

              {/* Profile Card Header (Centered Photo + Stacked Details) */}
              <div className="flex flex-col items-center justify-center text-center gap-4 bg-[var(--fog)] p-6 sm:p-8 rounded-2xl border border-[var(--line)]">
                <div className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[var(--iris)] shadow-md flex-shrink-0 bg-[#0c4b8e] mx-auto">
                  <Image
                    src={lateChairmanData.imageUrl}
                    alt={lateChairmanData.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="text-center space-y-1.5 max-w-lg mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
                    {lateChairmanData.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0C2340] uppercase tracking-wide">
                    {lateChairmanData.designation}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                    Founder & Visionary behind Haji Murad Trust Eye Hospital's non-profit vision care movement.
                  </p>
                </div>
              </div>

              {/* Message Content in Urdu */}
              {(() => {
                const { bismillahHeader, paragraphs } = parseUrduText(lateChairmanData.message);
                return (
                  <div className="space-y-6 text-right" dir="rtl">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <p className={`${notoNastaliq.className} text-base sm:text-lg text-emerald-800 font-bold leading-loose`}>
                        {bismillahHeader}
                      </p>
                    </div>

                    <div className="space-y-4 text-slate-800">
                      {paragraphs.split("\n\n").map((para, idx) => (
                        <p key={idx} className={`${notoNastaliq.className} text-xs sm:text-sm lg:text-base font-normal leading-[2.0] tracking-normal text-justify`}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* Red Left-Aligned Signature Sign-off Block */}
                    <div className="pt-6 border-t border-slate-100 flex justify-start text-left" dir="ltr">
                      <div className="text-left font-extrabold text-red-600 space-y-0.5 leading-snug">
                        <p className="text-base sm:text-lg tracking-tight font-extrabold text-red-600">
                          {lateChairmanData.name}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-red-600">
                          {lateChairmanData.designation}
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-red-600">
                          Haji Murad Trust Eye Hospital
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.section>


            {/* ---------------- SECTION 2: CHAIRMAN'S MESSAGE ---------------- */}
            <motion.section
              id="chairman-message"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--line)] shadow-xl relative overflow-hidden space-y-8 scroll-mt-28"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-700" /> Leadership & Guidance
                </span>
                <span className="text-xs font-extrabold text-slate-400">Current Leadership</span>
              </div>

              {/* Profile Card Header (Centered Photo + Stacked Details) */}
              <div className="flex flex-col items-center justify-center text-center gap-4 bg-[var(--fog)] p-6 sm:p-8 rounded-2xl border border-[var(--line)]">
                <div className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[var(--ink)] shadow-md flex-shrink-0 bg-[#0c4b8e] mx-auto">
                  <Image
                    src={chairmanData.imageUrl}
                    alt={chairmanData.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="text-center space-y-1.5 max-w-lg mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
                    {chairmanData.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0C2340] uppercase tracking-wide">
                    {chairmanData.designation}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                    Guiding the hospital's expansion into modern femtosecond laser technology and specialized ophthalmic subspecialties.
                  </p>
                </div>
              </div>

              {/* Message Content in Urdu */}
              {(() => {
                const { bismillahHeader, paragraphs } = parseUrduText(chairmanData.message);
                return (
                  <div className="space-y-6 text-right" dir="rtl">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <p className={`${notoNastaliq.className} text-base sm:text-lg text-emerald-800 font-bold leading-loose`}>
                        {bismillahHeader}
                      </p>
                    </div>

                    <div className="space-y-4 text-slate-800">
                      {paragraphs.split("\n\n").map((para, idx) => (
                        <p key={idx} className={`${notoNastaliq.className} text-xs sm:text-sm lg:text-base font-normal leading-[2.0] tracking-normal text-justify`}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* Red Left-Aligned Signature Sign-off Block */}
                    <div className="pt-6 border-t border-slate-100 flex justify-start text-left" dir="ltr">
                      <div className="text-left font-extrabold text-red-600 space-y-0.5 leading-snug">
                        <p className="text-base sm:text-lg tracking-tight font-extrabold text-red-600">
                          {chairmanData.name}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-red-600">
                          {chairmanData.designation}
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-red-600">
                          Haji Murad Trust Eye Hospital
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.section>


            {/* ---------------- SECTION 3: ADMIN'S MESSAGE ---------------- */}
            <motion.section
              id="admin-message"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-[var(--line)] shadow-xl relative overflow-hidden space-y-8 scroll-mt-28"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <span className="bg-teal-100 text-teal-900 border border-teal-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-teal-700" /> Hospital Administration
                </span>
                <span className="text-xs font-extrabold text-slate-400">Operational Excellence</span>
              </div>

              {/* Profile Card Header (Centered Photo + Stacked Details) */}
              <div className="flex flex-col items-center justify-center text-center gap-4 bg-[var(--fog)] p-6 sm:p-8 rounded-2xl border border-[var(--line)]">
                <div className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-teal-600 shadow-md flex-shrink-0 bg-[#0c4b8e] mx-auto">
                  <Image
                    src={adminData.imageUrl}
                    alt={adminData.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="text-center space-y-1.5 max-w-lg mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
                    {adminData.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0C2340] uppercase tracking-wide">
                    {adminData.designation}
                  </p>
                  <p className="text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                    Overseeing patient workflows, state-of-the-art diagnostic equipment, and transparent hospital administration.
                  </p>
                </div>
              </div>

              {/* Message Content in Urdu */}
              {(() => {
                const { bismillahHeader, paragraphs } = parseUrduText(adminData.message);
                return (
                  <div className="space-y-6 text-right" dir="rtl">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <p className={`${notoNastaliq.className} text-base sm:text-lg text-emerald-800 font-bold leading-loose`}>
                        {bismillahHeader}
                      </p>
                    </div>

                    <div className="space-y-4 text-slate-800">
                      {paragraphs.split("\n\n").map((para, idx) => (
                        <p key={idx} className={`${notoNastaliq.className} text-xs sm:text-sm lg:text-base font-normal leading-[2.0] tracking-normal text-justify`}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* Red Left-Aligned Signature Sign-off Block */}
                    <div className="pt-6 border-t border-slate-100 flex justify-start text-left" dir="ltr">
                      <div className="text-left font-extrabold text-red-600 space-y-0.5 leading-snug">
                        <p className="text-base sm:text-lg tracking-tight font-extrabold text-red-600">
                          {adminData.name}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-red-600">
                          {adminData.designation}
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-red-600">
                          Haji Murad Trust Eye Hospital
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.section>
              </>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
