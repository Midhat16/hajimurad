"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Tag,
  ArrowRight,
  Star,
  CheckCircle2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react";

export default function EventCard({ event, index = 0 }) {
  // Extract images array (fallback to imageUrl if images array missing)
  const imagesList = Array.isArray(event?.images) && event.images.length > 0
    ? event.images
    : (event?.imageUrl ? [event.imageUrl] : []);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const eventStatus = event?.status === "Completed" ? "Past" : (event?.status || "Upcoming");
  const isUpcoming = eventStatus === "Upcoming";
  const isPast = eventStatus === "Past";

  const getStatusBadgeStyle = () => {
    if (isUpcoming) return "bg-emerald-600 border border-emerald-500";
    if (isPast) return "bg-slate-800 border border-slate-700";
    return "bg-amber-600 border border-amber-500";
  };

  const currentMainImage = imagesList[activeImgIndex] || imagesList[0] || "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="w-full max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden border border-[var(--line)] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col group"
      >
        {/* ================= 1. TOP SECTION: FULL WIDTH BANNER IMAGE ================= */}
        <div
          className="relative w-full h-80 sm:h-96 md:h-[420px] bg-slate-100 overflow-hidden cursor-pointer group/img"
          onClick={() => currentMainImage && setLightboxOpen(true)}
        >
          {currentMainImage ? (
            <img
              src={currentMainImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[var(--ink)] to-[var(--iris-dark)] flex items-center justify-center p-8 text-white text-center">
              <Calendar className="w-20 h-20 opacity-30" />
            </div>
          )}

          {/* Subtly Scrimmed Gradient Overlay for Top Badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

          {/* Top-Left & Top-Right Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            {/* Category Tag */}
            <span className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-[var(--ink)] border border-black/10 shadow-md flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--iris)]" />
              {event.category || "Hospital Event"}
            </span>

            {/* Status & Star Badges */}
            <div className="flex items-center gap-2">
              {event.isStarred && (
                <span className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-slate-950" /> Featured
                </span>
              )}
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-md ${getStatusBadgeStyle()}`}>
                {eventStatus}
              </span>
            </div>
          </div>

          {/* Expand Photo Button */}
          {currentMainImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/20 opacity-90 group-hover/img:opacity-100 transition-all shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Expand Photo</span>
            </button>
          )}
        </div>

        {/* Gallery Thumbnails Bar (If multiple images exist) */}
        {imagesList.length > 1 && (
          <div className="bg-slate-900 p-3.5 border-t border-slate-800 flex items-center gap-3 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 pl-1 flex items-center gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[var(--iris)]" /> Event Photos ({imagesList.length}):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImgIndex(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    activeImgIndex === idx
                      ? "border-[var(--iris)] ring-2 ring-[var(--iris)]/40 scale-105 opacity-100"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= 2. BOTTOM SECTION: STACKED DETAILS & ACTION CTA ================= */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
          <div className="space-y-4">
            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2B1F1A] leading-tight tracking-tight group-hover:text-[var(--ink)] transition-colors">
              {event.title}
            </h3>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              {event.description}
            </p>

            {/* Key Event Details Grid (Date, Time, Venue, Speaker) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[var(--fog)] border border-[var(--line)] rounded-2xl p-4 sm:p-5 text-xs font-bold text-[#2B1F1A]">
              {event.date && (
                <div className="flex items-center gap-3 text-[#0F172A]">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs flex-shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#334155] font-black uppercase tracking-wider block">Event Date</span>
                    <span className="text-xs sm:text-sm font-black text-[#0F172A]">{event.date}</span>
                  </div>
                </div>
              )}

              {event.time && (
                <div className="flex items-center gap-3 text-[#0F172A]">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs flex-shrink-0">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#334155] font-black uppercase tracking-wider block">Timings</span>
                    <span className="text-xs sm:text-sm font-black text-[#0F172A]">{event.time}</span>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3 text-[#0F172A]">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs flex-shrink-0">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#334155] font-black uppercase tracking-wider block">Venue / Location</span>
                    <span className="text-xs sm:text-sm font-black text-[#0F172A] truncate block">{event.location}</span>
                  </div>
                </div>
              )}

              {event.organizer && (
                <div className="flex items-center gap-3 text-[#0F172A]">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs flex-shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#334155] font-black uppercase tracking-wider block">Featured Guest / Organizer</span>
                    <span className="text-xs sm:text-sm font-black text-[#0F172A] truncate block">{event.organizer}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= LIGHTBOX GALLERY MODAL ================= */}
      <AnimatePresence>
        {lightboxOpen && currentMainImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/20 transition-all cursor-pointer z-50"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Lightbox Image */}
            <div
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imagesList[activeImgIndex] || currentMainImage}
                alt={event.title}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
              />

              {/* Lightbox Footer & Navigation */}
              <div className="flex items-center justify-between w-full max-w-lg px-4 text-white text-xs font-bold">
                {imagesList.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1))}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                ) : (
                  <div />
                )}

                <span className="text-slate-300">
                  {imagesList.length > 1 ? `Photo ${activeImgIndex + 1} of ${imagesList.length}` : event.title}
                </span>

                {imagesList.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0))}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
