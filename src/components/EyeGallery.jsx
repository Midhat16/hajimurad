"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, Activity } from "lucide-react";

const GALLERY_IMAGES = [
  {
    id: 1,
    src: "/images/haji-murad-main-campus.webp",
    alt: "Haji Murad Trust Eye Hospital Main Campus Building",
    caption: "Haji Murad Trust Eye Hospital Campus",
    tag: "Hospital Campus",
  },
  {
    id: 2,
    src: "/images/gallery-visual-field.jpg",
    alt: "Visual field Testing",
    caption: "Visual field Testing",
    tag: "Diagnostics",
  },
  {
    id: 3,
    src: "/images/gallery-biometry.jpg",
    alt: "Biometry performing",
    caption: "Biometry performing",
    tag: "Doctor Clinic",
  },
  {
    id: 4,
    src: "/images/gallery-oct.jpg",
    alt: "OCT Performing",
    caption: "OCT Performing",
    tag: "Diagnostics",
  },
  {
    id: 5,
    src: "/images/gallery-yag-1.jpg",
    alt: "YAG Capsulotomy",
    caption: "YAG Capsulotomy",
    tag: "Laser Procedure",
  },
  {
    id: 6,
    src: "/images/gallery-zeiss.jpg",
    alt: "Advanced ZEISS Ophthalmic Diagnostics",
    caption: "Advanced ZEISS Ophthalmic Diagnostics",
    tag: "Specialized Care",
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
      className="relative w-full max-w-[360px] min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col items-center justify-center select-none mx-auto overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Soft Glow Aura (Soft Light UV Shade) */}
      <div className="absolute w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full bg-gradient-to-tr from-indigo-950/10 to-[#8B5CF6]/10 blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER: IDLE CROSSFADE / EXPANDED ORBITAL GALLERY */}
      <div className="relative w-44 h-44 sm:w-56 sm:h-56 lg:w-72 lg:h-72 aspect-square flex items-center justify-center flex-shrink-0 mx-auto">
        {/* Outer Decorative Pulsing Glow Ring - Perfectly Concentric with Main Image Circle */}
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
          className="absolute w-52 h-52 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full border-2 border-dashed border-indigo-400/20 pointer-events-none z-0"
        />

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
                  className={`absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 cursor-pointer transition-shadow shadow-md ${isSelected
                    ? "bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] ring-4 ring-[var(--iris)]/30 shadow-lg"
                    : "bg-white border-2 border-[var(--line)] hover:border-[var(--iris)]"
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
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-[var(--ink)] to-[var(--iris)] shadow-xl z-20 overflow-hidden relative flex-shrink-0 aspect-square"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage.id}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full relative rounded-full overflow-hidden bg-[#0C1322]"
                >
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    priority
                    sizes="144px"
                    className="object-cover rounded-full"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          /* IDLE / MOBILE VIEW: MAIN SINGLE ROTATING PHOTO FRAME (PERFECT 1:1 CIRCLE) */
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 lg:w-72 lg:h-72 aspect-square rounded-full p-1 sm:p-1.5 bg-gradient-to-tr from-[var(--ink)] via-[#2B1F1A] to-[var(--iris)] shadow-xl overflow-hidden group cursor-pointer flex-shrink-0 mx-auto z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage.id}
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full rounded-full overflow-hidden relative bg-[#0C1322]"
              >
                <Image
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  priority
                  sizes="(max-width: 640px) 176px, (max-width: 1024px) 224px, 288px"
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                />

                {/* Subtle Inner Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/40 via-transparent to-transparent pointer-events-none" />
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
        className="mt-2.5 sm:mt-4 glass-card bg-white/95 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 border border-[var(--line)] shadow-md z-30 pointer-events-none max-w-[230px] sm:max-w-[260px]"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--fog)] flex items-center justify-center text-[var(--iris)] flex-shrink-0">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left overflow-hidden">
          <span className="text-[9px] font-bold text-[var(--iris)] uppercase tracking-widest block truncate">
            {activeImage.tag}
          </span>
          <span className="text-xs font-bold text-[#2B1F1A] block truncate leading-snug">
            {activeImage.caption}
          </span>
        </div>
      </motion.div>

      {/* DOT NAVIGATION & CAROUSEL CONTROLS */}
      <div className="mt-3 flex items-center gap-3 z-30">
        <button
          onClick={handlePrev}
          className="p-1 rounded-full border border-[var(--line)] bg-white text-[#2B1F1A] hover:text-[var(--iris)] hover:border-[var(--iris)] shadow-xs transition-colors cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {GALLERY_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === activeIndex
                ? "w-5 bg-[var(--ink)]"
                : "w-2 bg-[var(--line)] hover:bg-[var(--iris)]"
                }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-1 rounded-full border border-[var(--line)] bg-white text-[#2B1F1A] hover:text-[var(--iris)] hover:border-[var(--iris)] shadow-xs transition-colors cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
