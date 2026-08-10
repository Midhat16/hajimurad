"use client";

import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ImagePicker from "@/components/admin/ImagePicker";
import { Image as ImageIcon, Plus, Trash2, X, AlertCircle, CheckCircle2, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminGalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Facility");
  const [customCategory, setCustomCategory] = useState("");
  const [order, setOrder] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    try {
      const q = query(collection(db, "galleryImages"), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setImages(list);
          setLoading(false);
        },
        (err) => {
          console.warn("Gallery admin snapshot fallback:", err);
          const unsubFallback = onSnapshot(
            collection(db, "galleryImages"),
            (snap) => {
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              setImages(list);
              setLoading(false);
            },
            (e) => {
              console.warn("Gallery admin fallback notice:", e);
              setLoading(false);
            }
          );
          return () => unsubFallback();
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn("Error fetching gallery images:", err);
      setLoading(false);
    }
  }, []);

  const handleAddImage = async (e) => {
    e.preventDefault();
    setError("");
    if (!imageUrl) {
      setError("Please select/upload an image first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCategory = category === "Other" ? customCategory.trim() || "General" : category;

      await addDoc(collection(db, "galleryImages"), {
        imageUrl,
        caption: caption.trim(),
        category: finalCategory,
        order: Number(order) || 1,
        createdAt: serverTimestamp(),
      });

      setSuccessMsg("Photo added to gallery live!");
      setTimeout(() => setSuccessMsg(""), 3500);

      // Reset form
      setImageUrl("");
      setCaption("");
      setCategory("Facility");
      setCustomCategory("");
      setOrder(images.length + 2);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding gallery image:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        setError("Firebase Permission Error: Please update Firestore Rules to allow write access to 'galleryImages' collection.");
      } else {
        setError(err?.message || "Failed to save photo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this photo from the gallery?")) return;
    try {
      await deleteDoc(doc(db, "galleryImages", id));
    } catch (err) {
      console.error("Error deleting image:", err);
      alert("Failed to delete photo.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--iris)] bg-[var(--fog)] px-2.5 py-0.5 rounded-md border border-[var(--line)]">
            Media Management
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight mt-1">
            Photo Gallery Manager
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
            Add, categorize, and delete hospital photos. Uploaded images immediately appear live on /media/gallery.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setOrder(images.length + 1);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Photo
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-[#2B1F1A]">Loading Gallery Manager...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[var(--line)] shadow-sm space-y-4 max-w-lg mx-auto">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-extrabold text-[#2B1F1A]">No Gallery Photos Added Yet</h3>
          <p className="text-xs text-slate-500 font-medium">
            Click "Add New Photo" to upload your first hospital event or facility image using ImgBB.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[var(--ink)] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add Photo Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <motion.div
              key={img.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-[var(--line)] shadow-sm overflow-hidden flex flex-col justify-between group relative rounded-none"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden flex items-center justify-center p-1">
                <img
                  src={img.imageUrl}
                  alt="Gallery Photo"
                  className="w-full h-full object-contain"
                />

                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute top-3 right-3 p-2 bg-rose-600/90 text-white hover:bg-rose-700 transition-all shadow-md cursor-pointer z-10 rounded-none"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs p-4 flex items-center justify-center overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-2xl max-w-lg w-full space-y-6 relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#2B1F1A]">Add Photo to Gallery</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Upload photo and specify category and display order.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddImage} className="space-y-5">
                {/* Image Picker */}
                <ImagePicker
                  label="Select & Upload Photo *"
                  value={imageUrl}
                  onChange={setImageUrl}
                />

                {/* Category & Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    >
                      <option value="Facility">Facility & OT</option>
                      <option value="Events">Hospital Events</option>
                      <option value="Eye Camps">Free Eye Camps</option>
                      <option value="Operations">Surgical Procedures</option>
                      <option value="Other">Custom Category...</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    />
                  </div>
                </div>

                {category === "Other" && (
                  <div>
                    <label className="text-xs font-bold text-[#2B1F1A] block mb-1">
                      Custom Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)]"
                    />
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving Photo..." : "Save to Gallery"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
