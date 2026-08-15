"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Award, Stethoscope, Calendar } from "lucide-react";
import { useLenis } from "lenis/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sortDoctors } from "@/lib/doctorUtils";

import DoctorPhotoFrame from "@/components/DoctorPhotoFrame";

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

  return `${daysText} • ${hoursText}`;
}

function DoctorCard({ doctor, index, handleBookConsult }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const scheduleDisplay = formatDoctorSchedule(doctor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="h-[430px] sm:h-[450px] w-full cursor-pointer select-none pt-6"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
    >
      {/* Inner card wrapper for smooth 3D flip */}
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* 1. FRONT SIDE */}
        <div
          className="absolute inset-0 w-full h-full rounded-[28px] p-5 sm:p-6 glass-card bg-white flex flex-col justify-between border border-[var(--line)] shadow-xs overflow-visible"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Doctor Profile Caduceus Framed Graphic */}
          <div className="flex flex-col items-center flex-1 justify-start">
            <div className="-mt-14 sm:-mt-16 mb-2">
              <DoctorPhotoFrame doctor={doctor} size="md" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#2B1F1A] text-center leading-tight">
              {doctor.name}
            </h3>
            <p className="text-xs sm:text-[13px] font-extrabold text-[var(--iris)] tracking-wide mt-0.5 text-center">
              {toTitleCase(doctor.role)}
            </p>
            <p className="text-xs sm:text-sm text-[var(--slate)] font-semibold mt-1 text-center line-clamp-2">
              {doctor.specialty}
            </p>
          </div>

          {/* Credentials Footer on Front */}
          <div className="border-t border-[var(--line)] pt-2 flex flex-col gap-1 h-[105px] flex-shrink-0 w-full min-w-0 justify-start">
            {/* 1. OPD Days / Schedule */}
            <div className="h-5 flex items-center justify-center w-full min-w-0">
              <div
                className={`flex items-center gap-1.5 text-[11px] font-bold justify-center w-full min-w-0 ${
                  scheduleDisplay === "Schedule not set" ? "text-slate-400 font-semibold italic" : "text-slate-700"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--iris)] flex-shrink-0" />
                <span className="truncate block">{scheduleDisplay}</span>
              </div>
            </div>

            {/* 2. PMDC Reg # Badge (Middle) */}
            <div className="h-6 flex items-center justify-center w-full min-w-0">
              {doctor.pmdcNo && (
                <div className="w-full text-[10px] font-bold text-[#2B1F1A] bg-[var(--fog)] py-0.5 px-2 rounded-md text-center border border-[var(--line)]">
                  PMDC Reg #: <span className="text-[var(--iris)] font-extrabold">{doctor.pmdcNo}</span>
                </div>
              )}
            </div>

            {/* 3. Full Education Qualifications */}
            <div className="h-[46px] flex items-center justify-center w-full min-w-0 pt-0.5">
              {doctor.education && (
                <div className="flex items-start gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[var(--slate)] justify-center w-full leading-snug text-center">
                  <GraduationCap className="w-3.5 h-3.5 text-[var(--iris)] flex-shrink-0 mt-0.5" />
                  <span className="break-words font-medium">{doctor.education}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. BACK SIDE (Flipped by 180 degrees) */}
        <div
          className="absolute inset-0 w-full h-full rounded-[28px] p-6 bg-gradient-to-b from-[var(--ink)] via-[var(--ink)] to-[var(--ink)] flex flex-col justify-between text-white border border-[var(--ink)] shadow-xl overflow-y-auto custom-scrollbar"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-lg sm:text-xl font-extrabold leading-tight text-white">{doctor.name}</h4>
              <p className="text-xs font-extrabold text-slate-200 tracking-wide mt-0.5">{toTitleCase(doctor.specialty || doctor.role)}</p>
              {doctor.pmdcNo && (
                <p className="text-[11px] text-slate-300 font-bold mt-0.5">PMDC #: {doctor.pmdcNo}</p>
              )}
            </div>

            <div
              className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${
                scheduleDisplay === "Schedule not set"
                  ? "bg-white/10 border-white/10 text-slate-300 italic"
                  : "bg-emerald-500/30 border-emerald-400/40 text-white shadow-xs"
              }`}
            >
              <Calendar className="w-4 h-4 flex-shrink-0 text-white" />
              <span className="text-white">Availability: {scheduleDisplay}</span>
            </div>

            {doctor.bio && (
              <p className="text-xs sm:text-[13px] text-white leading-relaxed font-semibold">
                {doctor.bio}
              </p>
            )}

            {doctor.fellowship && (
              <div className="space-y-1 border-t border-white/20 pt-2">
                <p className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">Fellowship Training</p>
                <p className="text-xs sm:text-[13px] text-white leading-relaxed font-bold">
                  {doctor.fellowship}
                </p>
              </div>
            )}
          </div>

          {/* Book Button on Back Only - ONLY IF doctor is marked as Consultant (isConsultant: true) */}
          {doctor.isConsultant === true && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBookConsult(e, doctor.name);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity mt-2 cursor-pointer border border-white/20"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Consultant
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const lenis = useLenis();

  useEffect(() => {
    try {
      const doctorsCol = collection(db, "doctors");
      const unsubscribe = onSnapshot(
        doctorsCol,
        (snapshot) => {
          const dataArray = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDoctors(sortDoctors(dataArray));
        },
        (error) => {
          console.warn("Firestore doctors fetch warning:", error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore initialization error:", err);
    }
  }, []);

  const handleBookConsult = (e, doctorName) => {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-appointment-modal", { detail: { doctorName } })
      );
    }
  };

  return (
    <section id="doctors" className="py-14 lg:py-16 bg-[var(--fog)] relative overflow-hidden">
      {/* Background radial soft blur */}
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-slate-100/40 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-white px-3.5 py-1.5 rounded-full border border-[var(--line)] shadow-xs mb-3">
              Expert Medical Board
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#2B1F1A] tracking-tight leading-tight">
              Meet Our Doctors
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[var(--slate)] leading-relaxed">
              Our specialists hold fellowships from the world's most prestigious ophthalmic institutions, active research chairs, and thousands of successful sight restoration surgeries.
            </p>
          </motion.div>
        </div>

        {/* Doctors Grid with 3D Flip Card Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {doctors.map((doctor, index) => (
            <DoctorCard
              key={doctor.id || index}
              doctor={doctor}
              index={index}
              handleBookConsult={handleBookConsult}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
