"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Award, Stethoscope, Calendar } from "lucide-react";
import { useLenis } from "lenis/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

function DoctorAvatar({ doctor }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [objectPosition, setObjectPosition] = useState("center 20%");
  const photo = doctor.photoUrl || doctor.photo || doctor.imageUrl;

  useEffect(() => {
    setImgFailed(false);
    setObjectPosition("center 20%");
  }, [photo]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalHeight > 0 && naturalWidth > 0) {
      const ratio = naturalHeight / naturalWidth;
      if (ratio > 1.2) {
        // Tall portrait image (full body photo) -> Focus on face near top (12%)
        setObjectPosition("center 12%");
      } else if (ratio < 0.85) {
        // Wide landscape image -> Center
        setObjectPosition("center center");
      } else {
        // Standard portrait/square -> Focus on 18% from top
        setObjectPosition("center 18%");
      }
    }
  };

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={doctor.name}
        className="w-full h-full rounded-full object-cover transition-all duration-300"
        style={{ objectPosition }}
        onLoad={handleImageLoad}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full rounded-full bg-gradient-to-tr ${
        doctor.gradient || "from-sky-400 to-blue-500"
      } flex items-center justify-center text-white text-2xl font-bold shadow-inner`}
    >
      {doctor.initials || doctor.name?.charAt(0) || "D"}
    </div>
  );
}

function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
          setDoctors(dataArray);
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
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-appointment-modal", { detail: { doctorName } })
      );
    }
  };

  return (
    <section id="doctors" className="py-14 lg:py-16 bg-[#E8F0EC] relative overflow-hidden">
      {/* Background radial soft blur */}
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-[#3E8E6E]/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-white px-3 py-1 rounded-full border border-[#D5E5DD] shadow-xs">
              Expert Medical Board
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B3D5C] tracking-tight leading-tight">
              Meet Our Doctors
            </h2>
            <p className="mt-3 text-base sm:text-lg text-[#3F4B4A] leading-relaxed">
              Our specialists hold fellowships from the world's most prestigious ophthalmic institutions, active research chairs, and thousands of successful sight restoration surgeries.
            </p>
          </motion.div>
        </div>

        {/* Doctors Grid with 3D Flip Card Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {doctors.map((doctor, index) => (
            <motion.div
              key={doctor.id || index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-[390px] sm:h-[410px] w-full group cursor-pointer"
              style={{ perspective: "1200px" }}
            >
              {/* Inner card wrapper for 3D flip */}
              <div
                className="w-full h-full relative transition-transform duration-700 ease-out"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateY(0deg)",
                }}
                onClick={(e) => {
                  const card = e.currentTarget;
                  if (card.style.transform === "rotateY(180deg)") {
                    card.style.transform = "rotateY(0deg)";
                  } else {
                    card.style.transform = "rotateY(180deg)";
                  }
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth >= 1024) {
                    e.currentTarget.style.transform = "rotateY(180deg)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth >= 1024) {
                    e.currentTarget.style.transform = "rotateY(0deg)";
                  }
                }}
              >
                
                {/* 1. FRONT SIDE */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[28px] p-5 sm:p-6 glass-card bg-white flex flex-col justify-between border border-[#D5E5DD] shadow-xs"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {/* Doctor Profile Graphic / Image */}
                  <div className="flex flex-col items-center mt-1 flex-1 justify-start">
                    <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-[#0B3D5C]/30 to-[#3E8E6E]/30 shadow-sm flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
                        <DoctorAvatar doctor={doctor} />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-[#D5E5DD] shadow-md text-[#0B3D5C] z-10">
                        <Stethoscope className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <h3 className="mt-3 text-lg sm:text-xl font-bold text-[#0B3D5C] text-center leading-tight">
                      {doctor.name}
                    </h3>
                    <p className="text-xs sm:text-[13px] font-extrabold text-[#3E8E6E] tracking-wide mt-0.5 text-center">
                      {toTitleCase(doctor.role)}
                    </p>
                    <p className="text-xs sm:text-sm text-[#3F4B4A] font-semibold mt-1 text-center line-clamp-2">
                      {doctor.specialty}
                    </p>
                  </div>

                  {/* Credentials Footer on Front (Fixed 105px footer for 100% horizontal alignment without empty space) */}
                  <div className="border-t border-[#D5E5DD]/60 pt-2 flex flex-col gap-1 h-[105px] flex-shrink-0 w-full min-w-0 justify-start">
                    {/* 1. OPD Days (Above PMDC) */}
                    <div className="h-5 flex items-center justify-center w-full min-w-0">
                      {doctor.availabilityDays && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 justify-center w-full min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-[#3E8E6E] flex-shrink-0" />
                          <span className="truncate block">{doctor.availabilityDays}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. PMDC Reg # Badge (Middle) */}
                    <div className="h-6 flex items-center justify-center w-full min-w-0">
                      {doctor.pmdcNo && (
                        <div className="w-full text-[10px] font-bold text-[#0B3D5C] bg-[#E8F0EC] py-0.5 px-2 rounded-md text-center border border-[#D5E5DD]">
                          PMDC Reg #: <span className="text-[#3E8E6E] font-extrabold">{doctor.pmdcNo}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Full Education Qualifications (Below PMDC, full multiline text) */}
                    <div className="h-[46px] flex items-center justify-center w-full min-w-0 pt-0.5">
                      {doctor.education && (
                        <div className="flex items-start gap-1.5 text-[10px] sm:text-[11px] font-semibold text-[#3F4B4A] justify-center w-full leading-snug text-center">
                          <GraduationCap className="w-3.5 h-3.5 text-[#3E8E6E] flex-shrink-0 mt-0.5" />
                          <span className="break-words font-medium">{doctor.education}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. BACK SIDE (Flipped by 180 degrees) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[32px] p-6 bg-gradient-to-b from-[#0B3D5C] via-[#082D44] to-[#0B3D5C] flex flex-col justify-between text-white border border-[#0B3D5C] shadow-xl overflow-y-auto"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-bold leading-tight text-white">{doctor.name}</h4>
                      <p className="text-[10px] text-[#3E8E6E] font-bold tracking-wider">{toTitleCase(doctor.specialty || doctor.role)}</p>
                      {doctor.pmdcNo && (
                        <p className="text-[10px] text-slate-300 font-semibold mt-0.5">PMDC #: {doctor.pmdcNo}</p>
                      )}
                    </div>

                    {doctor.availabilityDays && (
                      <div className="bg-white/10 p-2 rounded-xl border border-white/15 text-xs text-emerald-300 font-bold">
                        🗓️ OPD: {doctor.availabilityDays}
                      </div>
                    )}

                    {doctor.bio && (
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {doctor.bio}
                      </p>
                    )}

                    {doctor.fellowship && (
                      <div className="space-y-1 border-t border-slate-700/80 pt-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fellowship Training</p>
                        <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                          {doctor.fellowship}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Book Button on Back */}
                  <a
                    href="#appointment"
                    onClick={(e) => handleBookConsult(e, doctor.name)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity mt-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Consult
                  </a>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
