"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, UploadCloud, RefreshCw, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function TechnologyForm({ initialData = null, onSave, isSaving = false, title = "Add New Technology" }) {
  const router = useRouter();

  // Normalize initial images array
  const getInitialImages = () => {
    if (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
      return initialData.images.filter((url) => typeof url === "string" && url.trim() !== "");
    }
    if (initialData?.imageUrl) {
      return [initialData.imageUrl];
    }
    return [];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    images: getInitialImages(),
    order: initialData?.order ?? 1,
    uses: initialData?.uses && initialData.uses.length > 0 ? initialData.uses : [""],
  });

  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pastedUrl, setPastedUrl] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      const initImgs = initialData.images && Array.isArray(initialData.images) && initialData.images.length > 0
        ? initialData.images.filter((url) => typeof url === "string" && url.trim() !== "")
        : (initialData.imageUrl ? [initialData.imageUrl] : []);

      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        images: initImgs,
        order: initialData.order ?? 1,
        uses: initialData.uses && initialData.uses.length > 0 ? initialData.uses : [""],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------- IMAGE UPLOAD & GALLERY HANDLERS ----------------

  // Convert File to Base64 Data URL fallback
  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Process & compress equipment images down to ultra-lightweight Base64 (~50KB)
  const processEquipmentImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const maxDim = 700;
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.70));
          } catch (err) {
            resolve(e.target.result);
          }
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Upload file and append into images array in the SAME block
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      let finalUrl = "";
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "6d700a708235b3658f287854659b43e8";

      // 1. Try direct ImgBB file upload first for short hosted URL (30 bytes)
      if (apiKey) {
        try {
          const bodyData = new FormData();
          bodyData.append("image", file);

          const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: bodyData,
          });
          const json = await res.json();
          if (json.success && json.data?.url) {
            finalUrl = json.data.url;
          }
        } catch (err) {
          console.warn("ImgBB upload failed, falling back to local compressed Base64:", err);
        }
      }

      // 2. If ImgBB failed or produced no URL, create lightweight compressed Base64 (~50KB)
      if (!finalUrl) {
        const compressedDataUrl = await processEquipmentImage(file);
        finalUrl = compressedDataUrl || (await fileToDataURL(file));
      }

      // Append to images array in the same unified gallery block
      setFormData((prev) => {
        const updatedImages = [...prev.images, finalUrl];
        return {
          ...prev,
          images: updatedImages,
          imageUrl: updatedImages[0] || "",
        };
      });
    } catch (err) {
      console.error("Image select error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add pasted URL into the gallery block
  const handleAddPastedUrl = () => {
    if (!pastedUrl.trim()) return;
    const urlToAdd = pastedUrl.trim();

    setFormData((prev) => {
      const updatedImages = [...prev.images, urlToAdd];
      return {
        ...prev,
        images: updatedImages,
        imageUrl: updatedImages[0] || "",
      };
    });

    setPastedUrl("");
    setShowUrlInput(false);
  };

  // Remove image thumbnail from the gallery block
  const removeImage = (index) => {
    setFormData((prev) => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: updatedImages,
        imageUrl: updatedImages[0] || "",
      };
    });
  };

  // Uses array handlers
  const handleUseChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.uses];
      updated[index] = value;
      return { ...prev, uses: updated };
    });
  };

  const addUseInput = () => {
    setFormData((prev) => ({ ...prev, uses: [...prev.uses, ""] }));
  };

  const removeUseInput = (index) => {
    setFormData((prev) => ({
      ...prev,
      uses: prev.uses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("Technology name is required.");

    setUploading(true);

    try {
      const rawImages = formData.images.filter((img) => typeof img === "string" && img.trim() !== "");

      // Ensure every image string is lightweight (compress heavy Base64 strings down to < 50KB)
      const compressedImages = await Promise.all(
        rawImages.map(async (imgStr) => {
          if (imgStr.startsWith("data:image") && imgStr.length > 80000) {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxDim = 700;
                let width = img.naturalWidth;
                let height = img.naturalHeight;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.68));
              };
              img.onerror = () => resolve(imgStr);
              img.src = imgStr;
            });
          }
          return imgStr;
        })
      );

      await onSave({
        ...formData,
        images: compressedImages,
        imageUrl: compressedImages[0] || formData.imageUrl || "",
        uses: formData.uses.filter((item) => item.trim() !== ""),
        order: Number(formData.order) || 1,
      });
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save technology: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/technologies"
            className="p-2 rounded-xl bg-white border border-[var(--line)] text-[#2B1F1A] hover:bg-[var(--fog)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2B1F1A] tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-semibold text-[var(--slate)] mt-0.5">
              Add or modify hardware diagnostic equipment and gallery images.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--line)] shadow-sm space-y-6">
        
        {/* UNIFIED SINGLE GALLERY UPLOADER BLOCK */}
        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--fog)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider block">
                Equipment Image Gallery (Multiple Photos)
              </label>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                All photos will rotate automatically every 5 seconds on the website. The 1st photo is the primary featured image. <span className="text-[var(--iris)] font-bold block sm:inline mt-0.5 sm:mt-0">For best results, upload images in 4:3 or 16:9 landscape orientation.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-extrabold text-[var(--iris)] bg-white px-3 py-1 rounded-full border border-[var(--line)] shadow-xs">
                {formData.images.length} Photo(s) Added
              </span>

              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[var(--iris)] bg-white px-2.5 py-1 rounded-lg border border-[var(--line)] cursor-pointer transition-colors"
              >
                <LinkIcon className="w-3 h-3" />
                {showUrlInput ? "Hide Link Input" : "Add Image URL"}
              </button>
            </div>
          </div>

          {/* Optional Paste Direct Image URL Bar */}
          {showUrlInput && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[var(--line)]">
              <input
                type="url"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="Paste direct image URL (e.g. https://i.ibb.co/...)"
                className="flex-1 text-xs px-3 py-1.5 focus:outline-none font-medium text-[#2B1F1A]"
              />
              <button
                type="button"
                onClick={handleAddPastedUrl}
                className="px-3 py-1.5 rounded-lg bg-[var(--iris)] text-white text-xs font-extrabold cursor-pointer hover:bg-[var(--ink)] transition-colors"
              >
                Add Link
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* THUMBNAILS + INLINE ADD PHOTO BUTTON IN THE SAME GRID BLOCK */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-1">
            
            {/* Uploaded Image Cards */}
            {formData.images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative w-full aspect-square rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-white group p-1 flex flex-col items-center justify-center"
              >
                <img
                  src={imgUrl}
                  alt={`Gallery Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain rounded-xl"
                />

                {/* Primary / Sequence Badge */}
                {idx === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-[var(--iris)] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs pointer-events-none">
                    Primary
                  </span>
                ) : (
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                    #{idx + 1}
                  </span>
                )}

                {/* Remove Image Button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transition-transform transform scale-90 hover:scale-100 cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* INLINE + ADD PHOTO BUTTON CARD (RIGHT NEXT TO THUMBNAILS IN THE SAME BLOCK) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-[var(--iris)]/40 hover:border-[var(--iris)] bg-white/80 hover:bg-white transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer group shadow-xs disabled:opacity-50"
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-6 h-6 text-[var(--iris)] animate-spin mb-1" />
                  <span className="text-[10px] font-bold text-slate-500">Uploading...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[var(--fog)] text-[var(--iris)] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-[#2B1F1A]">Add Photo</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">Click to upload</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Equipment Name & Order */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Equipment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Femtosecond Laser Platform"
              required
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Display Sequence Order (1, 2, 3...)
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min={1}
              className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Equipment Overview & Specifications (Intro Paragraph)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Non-invasive high-resolution imaging..."
            className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all resize-none"
          />
        </div>

        {/* Uses List */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
              Uses (Bullet Points)
            </label>
            <button
              type="button"
              onClick={addUseInput}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--iris)] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Use Bullet Item
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.uses.map((useItem, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={useItem}
                  onChange={(e) => handleUseChange(index, e.target.value)}
                  placeholder={`Use Bullet ${index + 1} (e.g. Precision corneal flap creation)`}
                  className="flex-1 bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl px-4 py-2.5 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
                />
                {formData.uses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUseInput(index)}
                    className="p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => router.push("/admin/technologies")}
            className="px-5 py-2.5 rounded-xl border border-[var(--line)] text-slate-600 font-extrabold text-xs hover:bg-[var(--fog)] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[var(--ink)] text-white font-extrabold text-xs shadow-md hover:bg-[var(--iris)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving Technology..." : "Save Technology Record"}
          </button>
        </div>

      </form>
    </div>
  );
}
