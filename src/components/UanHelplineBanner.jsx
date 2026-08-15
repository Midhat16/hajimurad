"use client";

import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PhoneCall, Clock, Phone, Sparkles } from "lucide-react";

export default function UanHelplineBanner() {
  const [uanNumber, setUanNumber] = useState("111 333 456");
  const [helplineTitle, setHelplineTitle] = useState("24/7 UAN Helpline");
  const [helplineSubtitle, setHelplineSubtitle] = useState("Need assistance? Our team is available 24/7.");
  const [helplineImage, setHelplineImage] = useState("/images/247-helpline.svg");

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, "siteContent", "contactInfo"),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.uanNumber || data.mainDeskNumber) {
              setUanNumber(data.uanNumber || data.mainDeskNumber);
            }
            if (data.uanHelplineTitle) {
              setHelplineTitle(data.uanHelplineTitle);
            }
            if (data.uanHelplineSubtitle) {
              setHelplineSubtitle(data.uanHelplineSubtitle);
            }
            if (data.uanHelplineImage) {
              setHelplineImage(data.uanHelplineImage);
            }
          }
        },
        (err) => console.warn("UanHelplineBanner onSnapshot error:", err)
      );

      return () => unsub();
    } catch (err) {
      console.warn("UanHelplineBanner listener error:", err);
    }
  }, []);

  // Format telephone number for tel: link (strip all non-digits except +)
  const cleanTelNumber = uanNumber.replace(/[^\d+]/g, "") || "111333456";

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-[var(--fog)] via-white to-[var(--fog)] font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CLICKABLE 24/7 HELPLINE CARD WRAPPER */}
        <a
          href={`tel:${cleanTelNumber}`}
          className="group relative block w-full bg-gradient-to-r from-white via-rose-50/50 to-white rounded-3xl p-4 sm:p-8 border-2 border-rose-200/90 hover:border-rose-500 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-500/20"
          aria-label={`Call ${helplineTitle} at ${uanNumber}`}
          title={`Click to call ${uanNumber}`}
        >
          {/* Subtle Ambient Background Decorative Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors pointer-events-none" />

          {/* MAIN RESPONSIVE CONTAINER */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
            
            {/* LEFT: 24/7 Clock/Helpline Image Container */}
            <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 flex items-center justify-center p-2 rounded-2xl bg-white border border-rose-100 shadow-sm group-hover:scale-105 transition-transform duration-300 overflow-hidden">
              <img
                src={helplineImage}
                alt={`${helplineTitle} - Emergency Service`}
                style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}
                className="block drop-shadow-xs"
              />
            </div>

            {/* MIDDLE: Text Info & UAN Display */}
            <div className="text-center md:text-left space-y-2 flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>24/7 Emergency Service</span>
              </div>

              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#2B1F1A] tracking-tight group-hover:text-rose-600 transition-colors leading-tight">
                {helplineTitle}
              </h2>

              <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-xl">
                {helplineSubtitle}
              </p>

              {/* UAN NUMBER HIGHLIGHT BADGE */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-500">
                  UAN Helpline:
                </span>
                <span className="text-lg sm:text-2xl lg:text-3xl font-black text-rose-600 tracking-wider font-mono bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  {uanNumber}
                </span>
              </div>
            </div>

            {/* RIGHT: Call Now Action Button */}
            <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0 flex justify-center">
              <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs sm:text-base px-5 py-3 sm:px-7 sm:py-4 rounded-2xl shadow-lg shadow-rose-600/30 group-hover:shadow-rose-600/50 group-hover:scale-105 transition-all duration-300 border border-white/20">
                <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-bounce shrink-0" />
                <span>Call Now</span>
              </div>
            </div>

          </div>
        </a>

      </div>
    </section>
  );
}
