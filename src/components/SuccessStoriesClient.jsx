"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HeartHandshake, Quote, User, Sparkles, ExternalLink, Play, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  getOptimizedCloudinaryVideoUrl,
  getCloudinaryVideoPosterUrl,
  isDirectVideoUrl,
  getYoutubeEmbedUrl,
  getYoutubeThumbnailUrl,
} from "@/lib/cloudinaryVideoUtil";

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

function renderSuccessStoryVideoButton(url) {
  if (!url || typeof url !== "string") return null;
  const targetUrl = url.trim();
  if (!targetUrl) return null;

  const lower = targetUrl.toLowerCase();
  let label = "Watch Video";
  let iconElement = <Play className="w-4 h-4 shrink-0 fill-current text-white" />;
  let bgClasses = "bg-[#1E1433] text-white hover:opacity-95 shadow-md border border-white/20";

  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    label = "Watch YouTube Video";
    iconElement = <YoutubeSvg />;
    bgClasses = "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 border border-red-500";
  } else if (lower.includes("instagram.com") || lower.includes("instagr.am")) {
    label = "Watch Reel on Instagram";
    iconElement = <InstagramSvg />;
    bgClasses = "bg-[#E1306C] hover:bg-[#c1275b] text-white shadow-md shadow-pink-600/20 border border-pink-500";
  } else if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    label = "Watch Facebook Video";
    iconElement = <FacebookSvg />;
    bgClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 border border-blue-500";
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

function SuccessStoryVideoDisplay({ videoUrl, title, patientName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!videoUrl || typeof videoUrl !== "string") return null;

  const directVideo = isDirectVideoUrl(videoUrl);
  const youtubeEmbed = getYoutubeEmbedUrl(videoUrl);
  const ytPoster = getYoutubeThumbnailUrl(videoUrl);
  const cloudinaryVideoPoster = directVideo ? getCloudinaryVideoPosterUrl(videoUrl) : null;

  // 1. Cloudinary / MP4 Direct Video
  if (directVideo) {
    const optimizedVideoUrl = getOptimizedCloudinaryVideoUrl(videoUrl);

    // If poster image from Cloudinary video frame is available:
    if (cloudinaryVideoPoster) {
      return (
        <div className="w-full">
          <div className="rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 aspect-video relative group">
            {isPlaying ? (
              <video
                src={optimizedVideoUrl}
                poster={cloudinaryVideoPoster}
                controls
                autoPlay
                preload="auto"
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-slate-900"
              >
                <Image
                  src={cloudinaryVideoPoster}
                  alt={title || `Patient Video Testimonial Cover - ${patientName || "Haji Murad Eye Hospital Trust"}`}
                  width={400}
                  height={225}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
                  <Play className="w-14 h-14 text-white fill-white drop-shadow-xl group-hover:scale-110 transition-transform duration-300 ml-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Direct MP4 Native Player (Shows actual video first frame in stopped condition)
    return (
      <div className="w-full">
        <div className="rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 aspect-video relative">
          <video
            src={optimizedVideoUrl}
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
      <div className="w-full">
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
              {ytPoster ? (
                <Image
                  src={ytPoster}
                  alt={title || "YouTube Patient Testimonial Video Cover - Haji Murad Eye Hospital Trust"}
                  width={400}
                  height={225}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0F172A] opacity-90" />
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
                <Play className="w-14 h-14 text-white fill-white drop-shadow-xl group-hover:scale-110 transition-transform duration-300 ml-1" />
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
      {renderVideoButton(videoUrl)}
    </div>
  );
}

export default function SuccessStoriesClient() {
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
    <main className="min-h-screen bg-[var(--fog)] pb-0 font-sans">
      {/* Top Banner */}
      <section className="bg-[#1E1433] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-6 shadow-md">
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
          <div className="space-y-6">
            {stories.map((item, idx) => {
              const hasVideo = Boolean(item.videoUrl || item.videoLink);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group mb-[10px]"
                >
                  <div className={`grid grid-cols-1 ${hasVideo ? "lg:grid-cols-12 gap-6 lg:gap-8 items-center" : "gap-6"}`}>
                    {/* Left Column: Patient Image + Metadata + Story Narrative */}
                    <div className={`${hasVideo ? "lg:col-span-7" : "col-span-1"} space-y-4`}>
                      {/* Patient Header Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        {item.imageUrl ? (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-md flex-shrink-0 bg-slate-100 ring-4 ring-slate-50">
                            <Image
                              src={item.imageUrl}
                              alt={`${item.patientName || "Patient"} Photo - Haji Murad Eye Hospital Trust Success Story`}
                              width={80}
                              height={80}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[var(--fog)] border border-[var(--line)] flex items-center justify-center text-[var(--iris)] font-bold flex-shrink-0 shadow-md ring-4 ring-slate-50">
                            <User className="w-8 h-8 text-slate-400" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-lg border border-[var(--line)] inline-block">
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

                      {/* Story Text Content */}
                      <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line text-justify">
                        {item.story}
                      </div>
                    </div>

                    {/* Right Column: Video Testimonial Display */}
                    {hasVideo && (
                      <div className="lg:col-span-5 flex flex-col justify-center">
                        <SuccessStoryVideoDisplay
                          videoUrl={item.videoUrl || item.videoLink}
                          posterUrl={item.imageUrl}
                          title={item.title}
                          patientName={item.patientName}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
