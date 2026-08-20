"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  GraduationCap,
  Award,
  Stethoscope,
  Calendar,
  Phone,
  Globe,
  CheckCircle2,
  FileText,
  Clock,
  Building2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import DoctorPhotoFrame from "@/components/DoctorPhotoFrame";
import { motion } from "framer-motion";

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const ALL_WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAY_NAMES = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

function formatTime12H(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH.toString().padStart(2, "0")}:${mStr || "00"} ${period}`;
}

function formatWorkingDaysRange(workingDaysArray) {
  const indices = ALL_WORKING_DAYS
    .map((day, idx) => (workingDaysArray.includes(day) ? idx : -1))
    .filter((idx) => idx !== -1);

  if (indices.length === 0) return "";

  const groups = [];
  let currentGroup = [indices[0]];

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === indices[i - 1] + 1) {
      currentGroup.push(indices[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [indices[i]];
    }
  }
  groups.push(currentGroup);

  const formattedGroups = groups.map((grp) => {
    if (grp.length === 1) {
      return SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[0]]];
    } else if (grp.length === 2) {
      if (groups.length === 1) {
        return `${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[0]]]}, ${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[1]]]}`;
      } else {
        return `${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[0]]]} - ${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[1]]]}`;
      }
    } else {
      return `${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[0]]]} - ${SHORT_DAY_NAMES[ALL_WORKING_DAYS[grp[grp.length - 1]]]}`;
    }
  });

  return formattedGroups.join(", ");
}

function formatDoctorSchedule(doctor) {
  if (
    !doctor ||
    !doctor.workingDays ||
    !Array.isArray(doctor.workingDays) ||
    doctor.workingDays.length === 0 ||
    !doctor.workingHours?.start ||
    !doctor.workingHours?.end
  ) {
    return "Schedule not set";
  }

  const daysText = formatWorkingDaysRange(doctor.workingDays);
  if (!daysText) return "Schedule not set";

  const start12 = formatTime12H(doctor.workingHours.start);
  const end12 = formatTime12H(doctor.workingHours.end);
  const hoursText = `${start12} - ${end12}`;

  return `${daysText} (${hoursText})`;
}

function DoctorDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No doctor ID provided.");
      setLoading(false);
      return;
    }

    async function fetchDoctor() {
      try {
        const docRef = doc(db, "doctors", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDoctor({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Doctor profile not found.");
        }
      } catch (err) {
        console.warn("Error fetching doctor details:", err);
        setError("Failed to load doctor profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctor();
  }, [id]);

  const handleBookConsult = (doctorName) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-appointment-modal", { detail: { doctorName } })
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
            Loading Specialist Profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-[#2B1F1A]">Doctor Not Found</h2>
          <p className="text-xs text-slate-500 font-semibold">
            {error || "The requested doctor profile is unavailable or may have been updated."}
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Medical Board
          </Link>
        </div>
      </div>
    );
  }

  const scheduleDisplay = formatDoctorSchedule(doctor);

  return (
    <div className="pb-16 bg-slate-50/50">
      {/* Top Banner Section */}
      <section className="bg-[#1E1433] text-white py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-xl mb-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 space-y-4">
          <Link
            href="/doctors"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#5EEAD4] hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Doctors & Medical Board
          </Link>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 text-white px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-[#5EEAD4] shrink-0" /> {doctor.specialty || "Eye Specialist"}
            </span>
            {doctor.isConsultant && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Available for Consultation
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {doctor.name}
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-medium">
            {toTitleCase(doctor.role)} • Haji Murad Eye Hospital Trust
          </p>
        </div>
      </section>

      {/* Main Profile Details Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">

          {/* Hero Header & Photo Card */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 border-b border-slate-100 pb-8">
            {/* Caduceus Framed Doctor Photo */}
            <div className="shrink-0">
              <DoctorPhotoFrame
                doctor={doctor}
                frameColor={doctor.frameColor || doctor.color}
                size="lg"
              />
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[var(--iris)] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  {doctor.specialty || "Ophthalmic Surgeon"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] mt-2">
                  {doctor.name}
                </h2>
                <p className="text-sm font-extrabold text-slate-500 uppercase tracking-wide mt-0.5">
                  {toTitleCase(doctor.role)}
                </p>
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {doctor.experienceYears && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 shadow-2xs">
                    <Award className="w-4 h-4 text-teal-600 shrink-0" />
                    {doctor.experienceYears}+ Years Experience
                  </span>
                )}

                {doctor.pmdcNo && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-[var(--iris)] shrink-0" />
                    PMDC #: <span className="text-[var(--iris)] font-extrabold">{doctor.pmdcNo}</span>
                  </span>
                )}

                {doctor.languagesSpoken && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                    {doctor.languagesSpoken}
                  </span>
                )}
              </div>

              {/* OPD Schedule Highlight Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                  Clinic Schedule & OPD Availability
                </span>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#2B1F1A]">
                  <Calendar className="w-4 h-4 text-[var(--iris)] shrink-0" />
                  <span>{scheduleDisplay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid: Education, Fellowship & Bio */}
          <div className="space-y-6">

            {/* Qualifications & Fellowship Section */}
            {(doctor.education || doctor.fellowship) && (
              <div className="space-y-4">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2B1F1A] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <GraduationCap className="w-4.5 h-4.5 text-[var(--iris)]" /> Qualifications & Fellowship Training
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctor.education && (
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Academic Qualifications
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        {doctor.education}
                      </p>
                    </div>
                  )}

                  {doctor.fellowship && (
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Sub-Specialty Fellowship
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        {doctor.fellowship}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bio / About Doctor */}
            {doctor.bio && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#2B1F1A] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText className="w-4.5 h-4.5 text-[var(--iris)]" /> Professional Profile & Clinical Background
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  {doctor.bio}
                </p>
              </div>
            )}

          </div>

          {/* END OF PAGE ACTION BUTTONS (Side-by-Side) */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3.5">
            <a
              href="tel:111333456"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold border border-slate-300 transition-all shadow-xs"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call Now (111 333 456)</span>
            </a>

            {doctor.isConsultant && (
              <button
                type="button"
                onClick={() => handleBookConsult(doctor.name)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] hover:opacity-95 text-white px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl transition-all cursor-pointer border border-white/20"
              >
                <Calendar className="w-4.5 h-4.5 text-[#5EEAD4]" />
                <span>Book Appointment</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DoctorDetailsClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[65vh] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
              Loading Specialist Profile...
            </p>
          </div>
        </div>
      }
    >
      <DoctorDetailsContent />
    </Suspense>
  );
}
