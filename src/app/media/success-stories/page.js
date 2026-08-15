"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HeartHandshake, Quote, User, Sparkles, ExternalLink, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const YoutubeSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function getYoutubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const target = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = target.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
}

function isDirectVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const str = url.trim().toLowerCase();
  if (str.startsWith("data:video/")) return true;
  if (str.endsWith(".mp4") || str.endsWith(".webm") || str.endsWith(".ogg") || str.endsWith(".mov")) return true;
  if (str.includes(".mp4?") || str.includes(".webm?")) return true;
  return false;
}

function renderVideoButton(url) {
  if (!url || typeof url !== "string") return null;
  const targetUrl = url.trim();
  if (!targetUrl) return null;

  const lower = targetUrl.toLowerCase();
  let label = "Watch Video Testimonial";
  let iconElement = <PlayCircle className="w-4 h-4 shrink-0" />;
  let bgClasses = "bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white hover:opacity-95 shadow-md border border-white/20";

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    label = "Watch Video on YouTube";
    iconElement = <YoutubeSvg />;
    bgClasses = "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 border border-red-500";
  } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    label = "Watch Reel on Instagram";
    iconElement = <InstagramSvg />;
    bgClasses = "bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white shadow-md border border-pink-400";
  } else if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    label = "Watch Video on Facebook";
    iconElement = <FacebookSvg />;
    bgClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-blue-500";
  }

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${bgClasses}`}
    >
      {iconElement}
      <span>{label}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0 ml-0.5" />
    </a>
  );
}

function SuccessStoryVideoDisplay({ videoUrl, posterUrl, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!videoUrl || typeof videoUrl !== "string") return null;
  const url = videoUrl.trim();
  if (!url) return null;

  const isVideoFile = isDirectVideoUrl(url);
  const youtubeEmbed = getYoutubeEmbedUrl(url);

  // 1. Direct Video File (MP4/WEBM/base64)
  if (isVideoFile) {
    return (
      <div className="w-full space-y-2 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--iris)] uppercase tracking-wider">
          <PlayCircle className="w-4 h-4 text-purple-600" /> Patient Video Testimonial
        </div>
        <div className="rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200 aspect-video relative group">
          <video
            src={url}
            poster={posterUrl || undefined}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // 2. YouTube Embed Video
  if (youtubeEmbed) {
    return (
      <div className="w-full space-y-2 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-extrabold text-rose-600 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <YoutubeSvg /> YouTube Video Testimonial
          </span>
          {!isPlaying && <span className="text-[10px] text-slate-400 font-bold">Click to Play Video</span>}
        </div>
        <div className="rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 aspect-video relative group">
          {isPlaying ? (
            <iframe
              src={youtubeEmbed}
              title={title || "YouTube Video Testimonial"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              onClick={() => setIsPlaying(true)}
              className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-slate-900"
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={title || "Video Cover"}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-red-950 opacity-90" />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 group-hover:bg-black/20 transition-colors p-4">
                <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-700 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-8 h-8 fill-current ml-0.5" />
                </div>
                <span className="text-xs font-extrabold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                  Click to Play Video
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. General External Video Link (Instagram, Facebook, etc.)
  return (
    <div className="pt-3 border-t border-slate-100 flex items-center justify-start mt-4">
      {renderVideoButton(url)}
    </div>
  );
}

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, "successStories"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setStories(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Success stories snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "successStories"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setStories(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Success stories fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching success stories:", err);
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-16 sm:pt-20 pb-16 font-sans">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-6 shadow-md">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <HeartHandshake className="w-4 h-4" /> Patient Recovery & Testimonials
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Patient Success Stories
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Real stories of restored sight, life-changing eye surgeries, and heartfelt expressions from our patients.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">Loading Success Stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-3 max-w-lg mx-auto">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Stories Published Yet</h3>
            <p className="text-xs text-slate-500 font-medium">
              Patient success stories will appear here as soon as they are added by the hospital team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stories.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group"
              >
                <div className="space-y-6 relative z-10">
                  {/* Top Header: Large Patient Photo & Metadata */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-5">
                    {item.imageUrl ? (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-md flex-shrink-0 bg-slate-100 ring-4 ring-slate-50">
                        <img
                          src={item.imageUrl}
                          alt={item.patientName || "Patient Photo"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--fog)] border border-[var(--line)] flex items-center justify-center text-[var(--iris)] font-bold flex-shrink-0 shadow-md ring-4 ring-slate-50">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-1 rounded-lg border border-[var(--line)] inline-block">
                          Patient Recovery
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#2B1F1A] tracking-tight leading-snug">
                        {item.title || "Restored Vision Journey"}
                      </h3>
                      {item.patientName && (
                        <p className="text-xs sm:text-sm font-bold text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {item.patientName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Testimonial Story Content */}
                  <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line text-justify">
                    {item.story}
                  </div>

                  {/* Video Player Display (File, YouTube Embed, or Link) */}
                  <SuccessStoryVideoDisplay
                    videoUrl={item.videoUrl || item.videoLink}
                    posterUrl={item.imageUrl}
                    title={item.title}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
