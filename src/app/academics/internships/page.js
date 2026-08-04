"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, Clock, Users, ArrowRight, BookOpen, CheckCircle2, Sparkles, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function InternshipsListingPage() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("all");

  useEffect(() => {
    try {
      const q = query(collection(db, "internships"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Filter only active items and sort by order / createdAt
          const activeDocs = docs.filter((item) => item.isActive !== false);
          activeDocs.sort((a, b) => (a.order || 0) - (b.order || 0));
          setInternships(activeDocs);
          setLoading(false);
        },
        (err) => {
          console.warn("Error fetching internships:", err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore listener error:", err);
      setLoading(false);
    }
  }, []);

  // Extract unique departments
  const departments = ["all", ...new Set(internships.map((i) => i.department).filter(Boolean))];

  // Filter internships by selected department
  const filteredInternships = internships.filter((item) => {
    if (selectedDept === "all") return true;
    return item.department?.toLowerCase() === selectedDept.toLowerCase();
  });

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Hero Header Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-12 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <GraduationCap className="w-4 h-4" /> Academic Training
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Internship Programs
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Gain practical experience, mentorship from internationally acclaimed surgeons, and state-of-the-art diagnostic expertise at Haji Murad Eye Hospital.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Department Filter Tabs */}
        {departments.length > 1 && (
          <div className="flex items-center justify-center gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-[var(--line)] shadow-xs max-w-3xl mx-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`py-2 px-4 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                  selectedDept === dept
                    ? "bg-[var(--ink)] text-white shadow-xs"
                    : "bg-[var(--fog)] text-[var(--slate)] hover:bg-[var(--line)]/20"
                }`}
              >
                {dept === "all" ? "All Departments" : dept}
              </button>
            ))}
          </div>
        )}

        {/* Internships Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">Loading Internship Opportunities...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] max-w-md mx-auto space-y-3 shadow-sm">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[var(--ink)]">No Active Internships Found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((program) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-[var(--line)] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[var(--iris)]/40"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--fog)] text-[var(--iris)] px-3 py-1 rounded-full border border-[var(--line)] flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {program.department || "Medical"}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {program.duration || "3 Months"}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-extrabold text-[var(--ink)] group-hover:text-[var(--iris)] transition-colors leading-tight">
                    {program.title}
                  </h2>

                  {/* Short Description */}
                  <p className="text-xs font-semibold text-[var(--slate)] line-clamp-3 leading-relaxed">
                    {program.description}
                  </p>

                  {/* Program Features / Seats */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--fog)] p-2.5 rounded-xl border border-[var(--line)]/60">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Available Seats</span>
                      <span className="font-extrabold text-[var(--ink)] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[var(--iris)]" /> {program.seatsAvailable || "Limited"} Positions
                      </span>
                    </div>
                    <div className="bg-[var(--fog)] p-2.5 rounded-xl border border-[var(--line)]/60">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Certificate</span>
                      <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Awarded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/academics/internships/apply?id=${program.id}`}
                    className="w-full py-3 px-4 rounded-2xl bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all group-hover:gap-3 cursor-pointer"
                  >
                    <span>View Details & Apply</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
