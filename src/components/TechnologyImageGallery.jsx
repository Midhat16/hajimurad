"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export default function TechnologyImageGallery({ images = [], name = "Technology Equipment" }) {
  // Normalize images prop: ensure array of non-empty strings
  const galleryImages = Array.isArray(images)
    ? images.filter((img) => typeof img === "string" && img.trim() !== "")
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef(null);

  // Mounted check for portal SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to start/reset the 5-second auto-rotation timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only auto-rotate if there are multiple images AND lightbox is closed
    if (galleryImages.length > 1 && !isLightboxOpen) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
      }, 5000);
    }
  };

  // Effect to manage auto-rotation lifecycle
  useEffect(() => {
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [galleryImages.length, isLightboxOpen]);

  // Keyboard Navigation & Body Scroll Locking for full-screen lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
      }
    };

    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, galleryImages.length]);

  // Handle manual thumbnail click
  const handleThumbnailClick = (index, e) => {
    e?.stopPropagation();
    setCurrentIndex(index);
    resetTimer();
  };

  // Next/Prev lightbox handlers
  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  // Fallback if no images provided
  if (galleryImages.length === 0) {
    return (
      <div className="w-full h-[280px] sm:h-[340px] md:h-[380px] rounded-2xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-[var(--iris)] p-6">
        <ImageIcon className="w-14 h-14 mb-2 opacity-50 text-slate-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          No Image Available
        </span>
      </div>
    );
  }

  const currentImageUrl = galleryImages[currentIndex] || galleryImages[0];

  return (
    <div className="w-full space-y-3">
      {/* ---------------- 1. MAIN FEATURED LARGE IMAGE CONTAINER ---------------- */}
      <div
        onClick={() => setIsLightboxOpen(true)}
        className="w-full h-[280px] sm:h-[340px] md:h-[380px] rounded-2xl bg-transparent relative group cursor-pointer select-none flex items-center justify-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full h-full flex items-center justify-center relative"
          >
            <img
              src={currentImageUrl}
              alt={`${name} - View ${currentIndex + 1}`}
              style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}
              className="rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </motion.div>
        </AnimatePresence>

        {/* Hover Full-Screen Zoom Overlay Badge */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center rounded-2xl">
          <span className="bg-[var(--ink)]/90 text-white text-xs font-extrabold px-3.5 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <Maximize2 className="w-3.5 h-3.5 text-[#5EEAD4]" /> Click for Fullscreen Lightbox
          </span>
        </div>

        {/* Top Image Counter Badge */}
        {galleryImages.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-white/10 shadow-xs pointer-events-none">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* ---------------- 2. THUMBNAIL ROW BELOW MAIN INLINE IMAGE ---------------- */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto py-2.5 px-2.5 no-scrollbar">
          {galleryImages.map((imgUrl, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleThumbnailClick(idx, e)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden transition-all duration-300 flex-shrink-0 cursor-pointer p-1 bg-white flex items-center justify-center ${
                  isSelected
                    ? "border-[3px] border-[var(--iris)] shadow-lg shadow-[var(--iris)]/25 scale-100 ring-0"
                    : "border border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400"
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${name} Thumbnail ${idx + 1}`}
                  style={{ objectFit: "contain", maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto" }}
                  className="rounded-xl"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ---------------- 3. FULL-SCREEN LIGHTBOX MODAL (PORTALED TO BODY AT Z-[999999]) ---------------- */}
      {mounted && createPortal(
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsLightboxOpen(false)}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="fixed inset-0 z-[999999] w-screen h-screen bg-black/98 backdrop-blur-2xl flex flex-col justify-between select-none overflow-hidden"
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100vh" }}
            >
              {/* TOP HEADER BAR: Technology Title (Left) + Close Button (Right) */}
              <div
                className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-30 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-extrabold tracking-tight truncate">
                    {name}
                  </h3>
                  {galleryImages.length > 1 && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Full-Screen View • Image {currentIndex + 1} of {galleryImages.length}
                    </p>
                  )}
                </div>

                {/* TOP-RIGHT CLOSE (×) BUTTON */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(false);
                  }}
                  className="p-2.5 sm:p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white border-2 border-white/40 transition-all cursor-pointer shadow-2xl flex items-center justify-center group hover:scale-110 shrink-0 ml-3 z-40"
                  aria-label="Close Lightbox"
                  title="Close Lightbox (Esc)"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* MAIN CONTENT AREA: Large Image (Left/Center) + Vertical Thumbnails (Right Column) */}
              <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between min-h-0 overflow-hidden relative">
                
                {/* Main Large Image Container */}
                <div
                  className="flex-1 w-full h-full relative flex items-center justify-center p-3 sm:p-6 min-h-0 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Previous Image Arrow */}
                  {galleryImages.length > 1 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-2 sm:left-6 z-30 p-2.5 sm:p-4 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110 flex items-center justify-center"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}

                  {/* High-Res Full Uncropped Image */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="w-full h-full flex items-center justify-center min-h-0 relative"
                    >
                      <img
                        src={currentImageUrl}
                        alt={`${name} Fullscreen View`}
                        style={{
                          objectFit: "contain",
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: "auto",
                          height: "auto",
                        }}
                        className="rounded-2xl shadow-2xl border border-white/10 block select-none max-h-[calc(100vh-140px)]"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Next Image Arrow */}
                  {galleryImages.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-2 sm:right-6 z-30 p-2.5 sm:p-4 rounded-full bg-black/70 text-white hover:bg-black/90 border border-white/20 transition-all cursor-pointer shadow-2xl hover:scale-110 flex items-center justify-center"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>

                {/* Right Column Vertical Thumbnails (Desktop) / Horizontal Row (Mobile) */}
                {galleryImages.length > 1 && (
                  <div
                    className="w-full md:w-36 lg:w-44 shrink-0 border-t md:border-t-0 md:border-l border-white/10 bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 flex md:flex-col items-center md:items-stretch gap-3 overflow-x-auto md:overflow-y-auto max-h-[110px] md:max-h-full no-scrollbar z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="hidden md:block pb-2 border-b border-white/10 text-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Gallery ({galleryImages.length})
                      </span>
                    </div>

                    {galleryImages.map((imgUrl, idx) => {
                      const isSelected = idx === currentIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => handleThumbnailClick(idx, e)}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-full md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 cursor-pointer p-1.5 bg-slate-900 flex items-center justify-center ${
                            isSelected
                              ? "border-[#5EEAD4] ring-2 ring-[#5EEAD4]/40 scale-105 shadow-xl"
                              : "border-white/20 opacity-50 hover:opacity-100 hover:border-white/60"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            style={{
                              objectFit: "contain",
                              maxWidth: "100%",
                              maxHeight: "100%",
                              width: "auto",
                              height: "auto",
                            }}
                            className="rounded-lg block"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
