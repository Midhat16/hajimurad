"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Image as ImageIcon,
  UploadCloud,
  X,
  Sparkles,
  Layers,
  FileText,
  Eye,
  Check,
  Video,
  Film,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminInternshipsPage() {
  const [activeTab, setActiveTab] = useState("programs"); // "programs" | "slider"
  const [internships, setInternships] = useState([]);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsCount, setApplicationsCount] = useState(0);

  // Slide Modal state
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideCaption, setSlideCaption] = useState("");
  const [slideMediaType, setSlideMediaType] = useState("image"); // "image" | "video"
  const [slideMediaUrl, setSlideMediaUrl] = useState("");
  const [slideFitMode, setSlideFitMode] = useState("cover"); // "cover" | "contain"
  const [slideOrder, setSlideOrder] = useState(1);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideFormError, setSlideFormError] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    let detailsProgs = [];
    let imageSliderSlides = [];

    const mergeAndSetState = () => {
      // 1. Merge Programs
      const pMap = new Map();
      detailsProgs.forEach((p) => {
        if (p && p.id && (p.title || p.department)) {
          pMap.set(p.id, p);
        }
      });
      const mergedPrograms = Array.from(pMap.values());
      mergedPrograms.sort((a, b) => (a.order || 0) - (b.order || 0));
      setInternships(mergedPrograms);

      // 2. Merge Slides
      const sMap = new Map();
      imageSliderSlides.forEach((s) => {
        if (s && s.id && (s.mediaUrl || s.url)) {
          sMap.set(s.id, s);
        }
      });
      const mergedSlides = Array.from(sMap.values());
      mergedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSlides(mergedSlides);

      setLoading(false);
    };

    // Listener 1: doc internships/details
    const unsubDetails = onSnapshot(
      doc(db, "internships", "details"),
      (snap) => {
        if (snap.exists()) {
          detailsProgs = Array.isArray(snap.data().programs) ? snap.data().programs : [];
        } else {
          detailsProgs = [];
        }
        mergeAndSetState();
      },
      () => setLoading(false)
    );

    // Listener 2: doc internships/imageSlider
    const unsubSlider = onSnapshot(
      doc(db, "internships", "imageSlider"),
      (snap) => {
        if (snap.exists()) {
          imageSliderSlides = Array.isArray(snap.data().slides) ? snap.data().slides : [];
        } else {
          imageSliderSlides = [];
        }
        mergeAndSetState();
      },
      () => {}
    );

    // Listener 3: Applications count
    const unsubApplications = onSnapshot(
      collection(db, "internshipApplications"),
      (snapshot) => {
        setApplicationsCount(snapshot.size);
      },
      (err) => console.warn("Error fetching applications count:", err)
    );

    return () => {
      unsubDetails();
      unsubSlider();
      unsubApplications();
    };
  }, []);

  const handleToggleActive = async (item) => {
    try {
      const detailsRef = doc(db, "internships", "details");
      const detailsSnap = await getDoc(detailsRef);
      if (detailsSnap.exists()) {
        const currentProgs = Array.isArray(detailsSnap.data().programs) ? detailsSnap.data().programs : [];
        const updated = currentProgs.map((p) =>
          p.id === item.id ? { ...p, isActive: !item.isActive } : p
        );
        await setDoc(detailsRef, { programs: updated, updatedAt: serverTimestamp() });
      }
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete internship program "${item.title || "Selected Internship"}"?`)) return;
    try {
      const detailsRef = doc(db, "internships", "details");
      const detailsSnap = await getDoc(detailsRef);
      if (detailsSnap.exists()) {
        const currentProgs = Array.isArray(detailsSnap.data().programs) ? detailsSnap.data().programs : [];
        const updated = currentProgs.filter((p) => p.id !== item.id);
        await setDoc(detailsRef, { programs: updated, updatedAt: serverTimestamp() });
      }
    } catch (err) {
      alert("Failed to delete internship program.");
    }
  };

  const handleOpenSlideModal = (slide = null) => {
    setSlideFormError("");
    if (slide) {
      setEditingSlide(slide);
      setSlideCaption(slide.caption || "");
      setSlideMediaType(slide.mediaType || "image");
      setSlideMediaUrl(slide.mediaUrl || slide.imageUrl || "");
      setSlideFitMode(slide.fitMode || "cover");
      setSlideOrder(slide.order || slides.length + 1);
    } else {
      setEditingSlide(null);
      setSlideCaption("");
      setSlideMediaType("image");
      setSlideMediaUrl("");
      setSlideFitMode("cover");
      setSlideOrder(slides.length + 1);
    }
    setSlideModalOpen(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    setSlideFormError("");

    try {
      const typeParam = file.type.startsWith("video/") || slideMediaType === "video" ? "video" : "image";
      const uploadedUrl = await uploadMediaToCloudinary(file, typeParam);
      if (uploadedUrl) {
        setSlideMediaUrl(uploadedUrl);
        if (file.type.startsWith("video/")) {
          setSlideMediaType("video");
        }
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setSlideFormError("Media upload failed: " + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    setSlideFormError("");

    if (!slideMediaUrl.trim()) {
      setSlideFormError("Please upload a file or provide a valid Photo/Video URL.");
      return;
    }

    setSavingSlide(true);
    try {
      const sliderRef = doc(db, "internships", "imageSlider");
      const sliderSnap = await getDoc(sliderRef);
      const currentSlides = sliderSnap.exists() && Array.isArray(sliderSnap.data().slides) ? [...sliderSnap.data().slides] : [];

      const slideId = editingSlide?.id || Date.now().toString() + "_" + Math.random().toString(36).substring(2, 6);
      const newSlideObj = {
        id: slideId,
        caption: slideCaption.trim() || "Clinical Training Demonstration",
        mediaType: slideMediaType,
        mediaUrl: slideMediaUrl.trim(),
        fitMode: slideFitMode,
        order: Number(slideOrder) || 1,
        isActive: editingSlide ? (editingSlide.isActive !== false) : true,
      };

      let updatedSlides = [];
      if (editingSlide && editingSlide.id) {
        updatedSlides = currentSlides.map((s) => (s.id === editingSlide.id ? newSlideObj : s));
      } else {
        updatedSlides = [...currentSlides, newSlideObj];
      }

      await setDoc(sliderRef, {
        slides: updatedSlides,
        updatedAt: serverTimestamp(),
      });

      setSlideModalOpen(false);
    } catch (err) {
      console.error("Error saving slide to Firestore:", err);
      setSlideFormError("Failed to save slide: " + err.message);
    } finally {
      setSavingSlide(false);
    }
  };

  const handleDeleteSlide = async (slide) => {
    if (!confirm(`Delete demonstration slide "${slide.caption}"? This will remove it from both Admin Panel and Public Website.`)) return;
    try {
      const sliderRef = doc(db, "internships", "imageSlider");
      const sliderSnap = await getDoc(sliderRef);
      if (sliderSnap.exists()) {
        const currentSlides = Array.isArray(sliderSnap.data().slides) ? sliderSnap.data().slides : [];
        const updatedSlides = currentSlides.filter((s) => s.id !== slide.id);
        await setDoc(sliderRef, {
          slides: updatedSlides,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      alert("Failed to delete slide: " + err.message);
    }
  };

  const handleToggleSlideActive = async (slide) => {
    try {
      const sliderRef = doc(db, "internships", "imageSlider");
      const sliderSnap = await getDoc(sliderRef);
      if (sliderSnap.exists()) {
        const currentSlides = Array.isArray(sliderSnap.data().slides) ? sliderSnap.data().slides : [];
        const nextStatus = slide.isActive === false ? true : false;
        const updatedSlides = currentSlides.map((s) => (s.id === slide.id ? { ...s, isActive: nextStatus } : s));
        await setDoc(sliderRef, {
          slides: updatedSlides,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      alert("Failed to update slide status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
              Academic Control
            </span>
            <h1 className="text-2xl font-black text-[#2B1F1A]">Internship Management</h1>
          </div>
          <p className="text-xs text-[var(--slate)] font-medium mt-1">
            Manage academic training programs, practical rotation modules, and live video/photo demonstration sliders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/internships/applications"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-4 h-4 text-[#5EEAD4]" />
            <span>Applications</span>
            {applicationsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-[var(--iris)] text-white rounded-full">
                {applicationsCount}
              </span>
            )}
          </Link>

          {activeTab === "programs" ? (
            <Link
              href="/admin/internships/new"
              className="inline-flex items-center gap-2 bg-[var(--iris)] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Program
            </Link>
          ) : (
            <button
              onClick={() => handleOpenSlideModal(null)}
              className="inline-flex items-center gap-2 bg-[var(--iris)] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[var(--iris-dark)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Slide / Video
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--line)]">
        <button
          onClick={() => setActiveTab("programs")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === "programs"
              ? "border-[var(--iris)] text-[var(--iris)] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Internship Programs ({internships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("slider")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === "slider"
              ? "border-[var(--iris)] text-[var(--iris)] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Demonstration Slider ({slides.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading Internship Data...</div>
      ) : activeTab === "programs" ? (
        /* PROGRAMS TAB */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No internship programs found in 'internships/details'.</p>
              <Link
                href="/admin/internships/new"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--iris)] text-white text-xs font-bold hover:bg-[var(--iris-dark)]"
              >
                <Plus className="w-4 h-4" /> Create First Program
              </Link>
            </div>
          ) : (
            internships.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--iris)]/10 text-[var(--iris)] px-3 py-1 rounded-full border border-[var(--iris)]/20">
                      {item.department || "Ophthalmology"}
                    </span>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full ${
                        item.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {item.isActive !== false ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{item.isActive !== false ? "Active" : "Inactive"}</span>
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{item.title}</h3>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[var(--iris)]" />
                      <span>{item.duration || "3 Months"}</span>
                    </div>
                    {item.timing && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-[var(--iris)]" />
                        <span>{item.timing}</span>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.description}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/admin/internships/edit?id=${item.id}`}
                    className="text-xs font-black text-[var(--iris)] hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Program
                  </Link>

                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* SLIDER TAB */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {slides.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold">No demonstration slides in 'internships/imageSlider'.</p>
                <button
                  onClick={() => handleOpenSlideModal(null)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--iris)] text-white text-xs font-bold hover:bg-[var(--iris-dark)]"
                >
                  <Plus className="w-4 h-4" /> Add Slide Now
                </button>
              </div>
            ) : (
              slides.map((slide) => (
                <div
                  key={slide.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    {slide.mediaType === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white relative">
                        <Video className="w-8 h-8 text-[#5EEAD4]" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-black uppercase bg-black/60 px-2 py-0.5 rounded text-white">Video</span>
                      </div>
                    ) : (
                      <img
                        src={slide.mediaUrl || slide.imageUrl}
                        alt={slide.caption}
                        className="w-full h-full object-cover"
                      />
                    )}

                    <button
                      onClick={() => handleToggleSlideActive(slide)}
                      className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                        slide.isActive !== false ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {slide.isActive !== false ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{slide.caption}</p>
                    <span className="text-[10px] font-semibold text-slate-400 block">Order: {slide.order}</span>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <button
                      onClick={() => handleOpenSlideModal(slide)}
                      className="text-xs font-black text-[var(--iris)] hover:underline flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => handleDeleteSlide(slide)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Slide Edit/Add Modal */}
      {slideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveSlide} className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingSlide ? "Edit Demonstration Slide" : "Add Demonstration Slide"}
              </h3>
              <button type="button" onClick={() => setSlideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {slideFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {slideFormError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Caption / Demonstration Title *</label>
              <input
                type="text"
                required
                value={slideCaption}
                onChange={(e) => setSlideCaption(e.target.value)}
                placeholder="e.g. OCT Reporting & Patient Diagnostics"
                className="w-full px-4 py-2.5 rounded-xl border text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Media Type</label>
                <select
                  value={slideMediaType}
                  onChange={(e) => setSlideMediaType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 font-medium"
                >
                  <option value="image">Image Photo</option>
                  <option value="video">Video Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Fit Mode</label>
                <select
                  value={slideFitMode}
                  onChange={(e) => setSlideFitMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 font-medium"
                >
                  <option value="cover">Crop Fill (Cover)</option>
                  <option value="contain">Show Entire (Contain)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Media File Upload or URL *</label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-full py-3 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingMedia ? "Uploading Media to Cloud..." : "Upload File from Device"}</span>
                </button>

                <input
                  type="text"
                  value={slideMediaUrl}
                  onChange={(e) => setSlideMediaUrl(e.target.value)}
                  placeholder="https://... or /images/..."
                  className="w-full px-4 py-2.5 rounded-xl border text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                value={slideOrder}
                onChange={(e) => setSlideOrder(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl border text-xs bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSlideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSlide || uploadingMedia}
                className="px-5 py-2 rounded-xl bg-[var(--iris)] text-white text-xs font-bold hover:bg-[var(--iris-dark)] disabled:opacity-50"
              >
                {savingSlide ? "Saving..." : "Save Slide"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
