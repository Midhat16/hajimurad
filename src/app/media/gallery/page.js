"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Image as ImageIcon, X, Maximize2, Sparkles, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_GALLERY_IMAGES = [
  {
    id: "def-1",
    imageUrl: "/images/gallery-visual-field.jpg",
    title: "Visual field Testing",
    category: "Diagnostics",
  },
  {
    id: "def-2",
    imageUrl: "/images/gallery-biometry.jpg",
    title: "Biometry performing",
    category: "Doctor Clinic",
  },
  {
    id: "def-3",
    imageUrl: "/images/gallery-oct.jpg",
    title: "OCT Performing",
    category: "Diagnostics",
  },
  {
    id: "def-4",
    imageUrl: "/images/gallery-yag-1.jpg",
    title: "YAG Capsulotomy",
    category: "Laser Procedure",
  },
  {
    id: "def-5",
    imageUrl: "/images/gallery-yag-2.jpg",
    title: "YAG Capsulotomy",
    category: "Operation Theater",
  },
  {
    id: "def-6",
    imageUrl: "/images/haji-murad-main-campus.webp",
    title: "Haji Murad Trust Eye Hospital Campus",
    category: "Hospital Campus",
  },
];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, "galleryImages"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setImages(list.length > 0 ? list : DEFAULT_GALLERY_IMAGES);
          setLoading(false);
        },
        (err) => {
          console.warn("Gallery snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "galleryImages"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setImages(list.length > 0 ? list : DEFAULT_GALLERY_IMAGES);
              setLoading(false);
            },
            (e) => {
              console.warn("Gallery fallback notice:", e);
              setImages(DEFAULT_GALLERY_IMAGES);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching gallery images:", err);
      setImages(DEFAULT_GALLERY_IMAGES);
      setLoading(false);
    }
  }, []);

  // Compute unique categories dynamically
  const categories = ["All", ...Array.from(new Set(images.map((img) => img.category).filter(Boolean)))];

  const filteredImages = selectedCategory === "All"
    ? images
    : images.filter((img) => img.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[var(--fog)] pt-24 pb-20 font-sans">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[var(--ink)] to-[var(--iris-dark)] text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-4">
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#5EEAD4] bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
            <ImageIcon className="w-4 h-4" /> Photo Gallery & Moments
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Hospital Photo Gallery
          </h1>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto font-medium leading-relaxed">
            A visual showcase of our state-of-the-art facilities, surgical suites, community eye camps, and hospital events.
          </p>
        </div>
      </section>

      {/* Sticky Category Header Bar (Flush with Navbar, 0px gap) */}
      {categories.length > 1 && (
        <div className="sticky top-[56px] sm:top-[68px] lg:top-[76px] z-40 bg-[var(--fog)] py-3 border-b border-[var(--line)] shadow-sm mb-8 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-md scale-105"
                    : "bg-white text-slate-700 border-[var(--line)] hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-[var(--line)] shadow-sm max-w-md mx-auto">
            <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">Loading Photo Gallery...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-3 max-w-lg mx-auto">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Photos Found</h3>
            <p className="text-xs text-slate-500 font-medium">
              Gallery photos will appear here as soon as they are added by the hospital admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((img, idx) => (
              <motion.div
                key={img.id || idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                onClick={() => setSelectedImage(img)}
                className="bg-white border border-[var(--line)] shadow-md hover:shadow-xl overflow-hidden group cursor-pointer relative flex flex-col rounded-2xl transition-all duration-300"
              >
                {/* Image container: object-cover fills full card container */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden w-full">
                  <img
                    src={img.imageUrl}
                    alt={img.title || img.caption || "Hospital Gallery Photo"}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                    <Maximize2 className="w-6 h-6" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">Enlarge</span>
                  </div>
                </div>
                <div className="p-3.5 bg-white border-t border-[var(--line)] text-center">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">
                    {img.title || img.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center cursor-pointer"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[85vh] bg-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black min-h-[300px]">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title || selectedImage.caption || "Full Size Photo"}
                  className="max-h-[75vh] w-auto object-contain mx-auto"
                />
              </div>
              <div className="p-4 bg-slate-900 border-t border-white/10 text-center">
                <h4 className="text-base font-bold text-white">
                  {selectedImage.title || selectedImage.caption}
                </h4>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
