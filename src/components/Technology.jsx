"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Eye, Zap, Layers, ShieldCheck, Activity } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Technology() {
  const [techList, setTechList] = useState([]);
  const [activeTech, setActiveTech] = useState(0);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "technologies"),
        (snapshot) => {
          const dataArray = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setTechList(dataArray);
        },
        (error) => {
          console.warn("Firestore technologies fetch warning:", error.message);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
    }
  }, []);

  return (
    <section id="technology" className="py-14 lg:py-16 bg-[#F4F7F5] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#3E8E6E]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0B3D5C]/10 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD]">
              Diagnostic & Surgical Suite
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3D5C] tracking-tight leading-tight">
              Pioneering Ophthalmic Technology
            </h2>
            <p className="mt-3 text-base text-[#3F4B4A]">
              We invest in state-of-the-art medical hardware to deliver surgeries with maximum safety margins, microscopic precision, and rapid visual recovery.
            </p>
          </motion.div>
        </div>

        {/* Tech Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Interactive Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {techList.map((tech, idx) => {
              const Icon = typeof tech.icon === "function" ? tech.icon : Cpu;
              const isActive = idx === activeTech;
              return (
                <motion.div
                  key={tech.id || idx}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setActiveTech(idx)}
                  className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? "bg-white border-[#0B3D5C] shadow-sm"
                      : "bg-white/70 hover:bg-white border-[#D5E5DD] shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {tech.imageUrl ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-[#D5E5DD]">
                        <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? "bg-[#0B3D5C] text-white" : "bg-[#E8F0EC] text-[#3E8E6E]"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-[#3E8E6E] uppercase tracking-widest leading-none">
                        {tech.category}
                      </p>
                      <h3 className="text-sm sm:text-base font-bold text-[#0B3D5C] mt-0.5 leading-snug">
                        {tech.name}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Technology Information Dashboard */}
          <div className="lg:col-span-7 h-full">
            {techList[activeTech] && (
              <motion.div
                key={activeTech}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-card bg-white rounded-3xl p-6 sm:p-8 border border-[#D5E5DD] shadow-md flex flex-col justify-between h-full min-h-[420px]"
              >
                <div className="space-y-6">
                  {/* Dashboard Header */}
                  <div className="border-b border-[#D5E5DD]/60 pb-5">
                    <span className="text-xs font-bold text-[#3E8E6E] uppercase tracking-widest">
                      Equipment Specs & Performance
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#0B3D5C] mt-1">
                      {techList[activeTech].name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                    {techList[activeTech].description}
                  </p>

                  {/* Specifications Grid */}
                  {techList[activeTech].specs && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Performance Telemetry
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(techList[activeTech].specs).map(([key, val]) => (
                          <div key={key} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {key}
                            </span>
                            <span className="text-sm font-bold text-slate-700 mt-1">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Security badge at bottom */}
                <div className="mt-8 border-t border-slate-100 pt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <ShieldCheck className="w-5 h-5 text-teal-500" />
                    <span className="text-xs font-bold text-slate-600">
                      Fully calibrated by medical engineers
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
