"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, Activity } from "lucide-react";

const GALLERY_IMAGES = [
  {
    id: 1,
    src: "/images/haji-murad-main-campus.jpg",
    alt: "Haji Murad Trust Eye Hospital Main Campus Building",
    caption: "Haji Murad Trust Eye Hospital Campus",
    tag: "Hospital Campus",
  },
  {
    id: 2,
    src: "/images/clinic-exam.jpg",
    alt: "Haji Murad Eye Hospital Advanced Diagnostic & Examination Room",
    caption: "Advanced Eye Examination & Consultation",
    tag: "Diagnostics Suite",
  },
  {
    id: 3,
    src: "/images/operation-theater.jpg",
    alt: "Haji Murad Eye Hospital Surgical Microscope Operation Theater",
    caption: "Carl Zeiss Micro-Incision Surgery Theater",
    tag: "Operation Theater",
  },
  {
    id: 4,
    src: "/images/clinic-exam.jpg",
    alt: "Human Iris & Vision Examination Suite",
    caption: "Advanced Iris & Retina Diagnostics",
    tag: "Refractive Care",
  },
  {
    id: 5,
    src: "/images/operation-theater.jpg",
    alt: "Ophthalmology Surgical Suite",
    caption: "Femtosecond Laser & Microscope Repair",
    tag: "Specialist Care",
  },
  {
    id: 6,
    src: "/images/haji-murad-main-campus.jpg",
    alt: "Haji Murad Trust Eye Hospital Entrance Grounds",
    caption: "Patient Care & Reception Grounds",
    tag: "Hospital Entrance",
  },
];

export default function EyeGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto rotate images when not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeImage = GALLERY_IMAGES[activeIndex];

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
  };

  return (
    <div
      className="relative w-full h-[320px] sm:h-[380px] lg:h-[420px] flex flex-col items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Soft Glow Aura */}
      <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#0B3D5C]/15 to-[#3E8E6E]/20 blur-3xl pointer-events-none" />

      {/* Outer Decorative Pulsing Glow Ring */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full border-2 border-dashed border-[#3E8E6E]/30 pointer-events-none"
      />

      {/* MAIN CONTAINER: IDLE CROSSFADE / EXPANDED ORBITAL GALLERY */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 flex items-center justify-center">
        
        {/* DESKTOP HOVER: ORBITAL CIRCULAR RING OF THUMBNAILS */}
        {!isMobile && isHovered ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {GALLERY_IMAGES.map((img, idx) => {
              // Calculate angular position in radians
              const count = GALLERY_IMAGES.length;
              const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
              const radius = 140; // orbit offset radius
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isSelected = idx === activeIndex;

              return (
                <motion.div
                  key={img.id}
                  initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                  animate={{
                    x: x,
                    y: y,
                    scale: isSelected ? 1.15 : 0.85,
                    opacity: isSelected ? 1 : 0.75,
                    zIndex: isSelected ? 30 : 10,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 14,
                    delay: idx * 0.03,
                  }}
                  whileHover={{ scale: 1.25, opacity: 1, zIndex: 40 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 cursor-pointer transition-shadow shadow-md ${
                    isSelected
                      ? "bg-gradient-to-tr from-[#0B3D5C] to-[#3E8E6E] ring-4 ring-[#3E8E6E]/30 shadow-lg"
                      : "bg-white border-2 border-[#D5E5DD] hover:border-[#3E8E6E]"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Center Spotlight Circle in Orbit View */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-[#0B3D5C] to-[#3E8E6E] shadow-xl z-20 overflow-hidden relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage.id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full relative rounded-full overflow-hidden"
                >
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    sizes="144px"
                    className="object-cover rounded-full"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          /* IDLE / MOBILE VIEW: MAIN SINGLE ROTATING PHOTO FRAME */
          <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-tr from-[#0B3D5C] via-[#2A607D] to-[#3E8E6E] shadow-xl overflow-hidden group cursor-pointer">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full rounded-full overflow-hidden relative"
              >
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  sizes="288px"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Subtle Inner Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D5C]/40 via-transparent to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FLOATING GLASS DYNAMIC CAPTION BADGE */}
      <motion.div
        key={activeImage.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 glass-card bg-white/95 rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-[#D5E5DD] shadow-md z-30 pointer-events-none max-w-[260px]"
      >
        <div className="w-8 h-8 rounded-xl bg-[#E8F0EC] flex items-center justify-center text-[#3E8E6E] flex-shrink-0">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left overflow-hidden">
          <span className="text-[9px] font-bold text-[#3E8E6E] uppercase tracking-widest block truncate">
            {activeImage.tag}
          </span>
          <span className="text-xs font-bold text-[#0B3D5C] block truncate leading-snug">
            {activeImage.caption}
          </span>
        </div>
      </motion.div>

      {/* DOT NAVIGATION & CAROUSEL CONTROLS */}
      <div className="mt-3 flex items-center gap-3 z-30">
        <button
          onClick={handlePrev}
          className="p-1 rounded-full border border-[#D5E5DD] bg-white text-[#0B3D5C] hover:text-[#3E8E6E] hover:border-[#3E8E6E] shadow-xs transition-colors cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {GALLERY_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex
                  ? "w-5 bg-[#0B3D5C]"
                  : "w-2 bg-[#D5E5DD] hover:bg-[#3E8E6E]"
              }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-1 rounded-full border border-[#D5E5DD] bg-white text-[#0B3D5C] hover:text-[#3E8E6E] hover:border-[#3E8E6E] shadow-xs transition-colors cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
