"use client";

import React, { useState, useRef } from "react";
import NextImage from "next/image";
import { UploadCloud, Image as ImageIcon, Trash2, Plus, AlertCircle, Link as LinkIcon } from "lucide-react";

export default function MultiImagePicker({
  values = [],
  onChange,
  label = "Program & Practical Training Media Gallery (Upload Photos)",
  showCaptions = true,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");

  const fileToDataURL = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const processAndCompress = (file, maxDim = 700, quality = 0.65) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
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

  const handleFilesSelect = async (filesList) => {
    if (!filesList || filesList.length === 0 || uploading) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: filesList.length });
    setError("");

    try {
      let completedCount = 0;

      const instantPreviews = await Promise.all(
        filesList.map(async (file) => {
          const dataUrl = (await processAndCompress(file)) || (await fileToDataURL(file));
          completedCount++;
          setUploadProgress({ current: completedCount, total: filesList.length });
          return dataUrl;
        })
      );

      const validPreviews = instantPreviews.filter(Boolean);
      if (validPreviews.length > 0) {
        const newItems = showCaptions
          ? validPreviews.map((url) => ({ url, caption: "" }))
          : validPreviews;
        onChange([...values, ...newItems]);
      }
    } catch (err) {
      console.error("Error processing preview images:", err);
      setError("Failed to process images. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
    if (e.target) e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = values.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const getItemUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.url || item.imageUrl || "";
  };

  const getItemCaption = (item) => {
    if (!item || typeof item === "string") return "";
    return item.caption || "";
  };

  const handleUrlChange = (index, newUrl) => {
    const updated = [...values];
    const current = updated[index];
    if (typeof current === "string") {
      updated[index] = { url: newUrl, caption: "" };
    } else if (current && typeof current === "object") {
      updated[index] = { ...current, url: newUrl };
    } else {
      updated[index] = { url: newUrl, caption: "" };
    }
    onChange(updated);
  };

  const handleCaptionChange = (index, newCaption) => {
    const updated = [...values];
    const current = updated[index];
    if (typeof current === "string") {
      updated[index] = { url: current, caption: newCaption };
    } else if (current && typeof current === "object") {
      updated[index] = { ...current, caption: newCaption };
    } else {
      updated[index] = { url: "", caption: newCaption };
    }
    onChange(updated);
  };

  const handleAddEmptyUrlLink = () => {
    const newItems = showCaptions ? [{ url: "", caption: "" }] : [""];
    onChange([...values, ...newItems]);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-[var(--iris)]" /> {label}
        </label>
        <span className="text-[11px] font-bold text-[var(--iris)] bg-[var(--fog)] px-2.5 py-1 rounded-full border border-[var(--line)]">
          {values.length} Image(s) Selected
        </span>
      </div>

      {/* Uploaded Images Preview Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {values.map((item, idx) => {
            const url = getItemUrl(item);
            const caption = getItemCaption(item);

            return (
              <div
                key={idx}
                className={`relative group bg-slate-50 border rounded-2xl overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                  idx === 0 ? "border-[var(--iris)] ring-2 ring-[var(--iris)]/20" : "border-slate-200"
                }`}
              >
                <div className="relative aspect-video bg-slate-900/10 overflow-hidden">
                  {url ? (
                    <NextImage
                      src={url}
                      alt={`${label || "Gallery"} image preview ${idx + 1}`}
                      width={200}
                      height={120}
                      unoptimized
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
                      No Image Preview
                    </div>
                  )}

                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-[var(--iris)] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                      Main Cover
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-rose-500 hover:text-white text-slate-700 p-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                  {!url.startsWith("data:image") && (
                    <div>
                      <label className="text-[10px] font-bold text-[#2B1F1A] uppercase tracking-wider block mb-0.5">
                        Image Link / URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                        className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--iris)]"
                      />
                    </div>
                  )}

                  {showCaptions && (
                    <div>
                      <label className="text-[10px] font-bold text-[#2B1F1A] uppercase tracking-wider block mb-0.5">
                        Caption (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Practical training session on biometry"
                        value={caption}
                        onChange={(e) => handleCaptionChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:border-[var(--iris)] bg-[var(--fog)] text-[#2B1F1A]"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Zone / Browse Computer Files Button */}
      <div className="p-5 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-white transition-all text-center">
        {uploading ? (
          <div className="flex items-center justify-center gap-3 py-3 text-xs font-bold text-[#2B1F1A]">
            <div className="w-5 h-5 border-2 border-[var(--iris)] border-t-transparent rounded-full animate-spin" />
            <span>
              {uploadProgress.total > 0
                ? `Processing Images (${uploadProgress.current} of ${uploadProgress.total})...`
                : "Processing Images..."}
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-extrabold text-[#2B1F1A]">Upload Media Gallery Photos</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Browse and select photos directly from your computer (JPG, PNG, WEBP)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Browse & Select Photos</span>
              </button>

              <button
                type="button"
                onClick={handleAddEmptyUrlLink}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Or paste an existing image URL link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Paste Link</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
