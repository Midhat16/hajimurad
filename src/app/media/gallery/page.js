"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { Image as ImageIcon, Sparkles, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_GALLERY_IMAGES = [
  {
    id: "def-1",
    key: "def-1",
    imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop",
    title: "Visual Field Testing",
    category: "Diagnostics",
    order: 1,
  },
  {
    id: "def-2",
    key: "def-2",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1200&auto=format&fit=crop",
    title: "Biometry performing",
    category: "Doctor Clinic",
    order: 2,
  },
  {
    id: "def-3",
    key: "def-3",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1200&auto=format&fit=crop",
    title: "OCT Performing",
    category: "Diagnostics",
    order: 3,
  },
  {
    id: "def-4",
    key: "def-4",
    imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1200&auto=format&fit=crop",
    title: "Slit-Lamp Examination",
    category: "Laser Procedure",
    order: 4,
  },
  {
    id: "def-5",
    key: "def-5",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop",
    title: "Autorefratometer Diagnostics",
    category: "Diagnostics",
    order: 5,
  },
  {
    id: "def-6",
    key: "def-6",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop",
    title: "Haji Murad Trust Eye Hospital Campus",
    category: "Hospital Campus",
    order: 6,
  },
];

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [photoDimensions, setPhotoDimensions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch gallery category documents from 'galleryImages' collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "galleryImages"),
      (snap) => {
        const allPhotos = [];

        snap.docs.forEach((d) => {
          const data = d.data();
          const catName = data.categoryName || d.id;
          const imgArr = Array.isArray(data.images) ? data.images : [];

          imgArr.forEach((img, idx) => {
            const url = img.url || img.imageUrl || img.src || "";
            if (url) {
              const imgId = img.id ? String(img.id) : `img-${idx}`;
              const uniqueKey = `${d.id}_${imgId}_${idx}`;
              allPhotos.push({
                id: uniqueKey,
                key: uniqueKey,
                imageUrl: url,
                title: img.caption || img.title || "",
                category: catName,
                order: Number(img.order) || (idx + 1),
              });
            }
          });
        });

        allPhotos.sort((a, b) => (a.order || 0) - (b.order || 0));

        if (allPhotos.length > 0) {
          setImages(allPhotos);
        } else {
          setImages(DEFAULT_GALLERY_IMAGES);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Error subscribing to galleryImages:", err);
        setImages(DEFAULT_GALLERY_IMAGES);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Measure actual natural dimensions for exact aspect ratio calculation
  useEffect(() => {
    if (!images || images.length === 0) return;

    images.forEach((img) => {
      const url = img.imageUrl || img.url || "";
      if (url && !photoDimensions[url]) {
        const tempImg = new Image();
        tempImg.src = url;
        tempImg.onload = () => {
          setPhotoDimensions((prev) => ({
            ...prev,
            [url]: {
              width: tempImg.naturalWidth || 800,
              height: tempImg.naturalHeight || 600,
            },
          }));
        };
        tempImg.onerror = () => {
          setPhotoDimensions((prev) => ({
            ...prev,
            [url]: { width: 800, height: 600 },
          }));
        };
      }
    });
  }, [images]);

  const categories = React.useMemo(() => {
    return ["All", ...Array.from(new Set((images || []).map((img) => img.category).filter(Boolean)))];
  }, [images]);

  const filteredImages = React.useMemo(() => {
    if (selectedCategory === "All") return images;
    return images.filter((img) => img.category === selectedCategory);
  }, [images, selectedCategory]);

  const measuredPhotos = React.useMemo(() => {
    return (filteredImages || []).map((img, index) => {
      const url = img.imageUrl || img.url || "";
      const dims = photoDimensions[url] || { width: 800, height: 600 };
      return {
        ...img,
        key: img.key || img.id || `gallery-photo-${index}`,
        src: url,
        width: dims.width,
        height: dims.height,
      };
    });
  }, [filteredImages, photoDimensions]);

  return (
    <main className="min-h-screen bg-[#9fb3c8] font-sans pt-20 sm:pt-24 pb-24">
      {/* Top Header Banner: Rich Maroon / Burgundy Background */}
      <section className="bg-gradient-to-r from-[#4A1521] via-[#521926] to-[#4A1521] text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-5 relative z-10">
          {/* Badge at top */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-emerald-400/80 bg-emerald-950/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>PHOTO GALLERY & MOMENTS</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-white tracking-tight leading-tight">
            Hospital Photo Gallery
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#e2e8f0] font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
            A visual showcase of our state-of-the-art facilities, surgical suites, community eye camps, and hospital events.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-4">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#4A1521] shadow-lg scale-105"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="py-24 text-center text-slate-700 font-bold flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-3 border-[#4A1521] border-t-transparent rounded-full animate-spin" />
            <span>Loading Hospital Photos...</span>
          </div>
        ) : measuredPhotos.length === 0 ? (
          <div className="py-24 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm max-w-md mx-auto p-8">
            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 font-bold text-base">No photos found in this category.</p>
          </div>
        ) : (
          <div className="w-full">
            <RowsPhotoAlbum
              photos={measuredPhotos}
              targetRowHeight={280}
              spacing={16}
              padding={0}
              rowConstraints={{ singleRowMaxHeight: 280 }}
              onClick={({ photo }) => setSelectedImage(photo)}
              componentsProps={{
                wrapper: {
                  className: "group relative shadow-md hover:shadow-2xl transition-all duration-300 border border-white/20 bg-slate-900",
                  style: {
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                    clipPath: "inset(0 round 1.25rem)",
                    WebkitClipPath: "inset(0 round 1.25rem)",
                  },
                },
                image: {
                  className: "w-full h-full object-contain transition-transform duration-500 group-hover:scale-105",
                  style: {
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                  },
                },
              }}
              render={{
                extras: (_, { photo }) => (
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end text-center transition-opacity duration-300 pointer-events-none"
                    style={{
                      borderRadius: "1.25rem",
                      clipPath: "inset(0 round 1.25rem)",
                      WebkitClipPath: "inset(0 round 1.25rem)",
                    }}
                  >
                    {photo.title && (
                      <h3 className="text-white text-xs sm:text-sm font-bold font-serif drop-shadow-md line-clamp-2 px-2 pb-1">
                        {photo.title}
                      </h3>
                    )}
                  </div>
                ),
              }}
            />
          </div>
        )}
      </main>

      {/* Modal Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors z-50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-w-5xl w-full space-y-4 text-center">
              <div className="relative aspect-video max-h-[75vh] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black flex items-center justify-center">
                <img
                  src={selectedImage.src || selectedImage.imageUrl}
                  alt={selectedImage.title || "Full view"}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                  {selectedImage.category}
                </span>
                {selectedImage.title && (
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-white max-w-2xl mx-auto pt-1">
                    {selectedImage.title}
                  </h3>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
