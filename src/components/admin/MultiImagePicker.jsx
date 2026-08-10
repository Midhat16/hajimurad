"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Trash2, Plus, Star, CheckCircle2, AlertCircle } from "lucide-react";

export default function MultiImagePicker({
  values = [],
  onChange,
  label = "Event Gallery / Photos (Multiple Images)",
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processAndCompress = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const maxDim = 1200;
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
            resolve(canvas.toDataURL("image/jpeg", 0.88));
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

  const uploadSingleFile = async (file) => {
    const dataUrl = await processAndCompress(file) || (await fileToDataURL(file));
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "6d700a708235b3658f287854659b43e8";
    const formData = new FormData();
    formData.append("image", dataUrl.replace(/^data:image\/\w+;base64,/, ""));

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data && (data.data.url || data.data.display_url)) {
        return data.data.url || data.data.display_url;
      }
      return dataUrl;
    } catch (err) {
      console.warn("ImgBB fetch fallback:", err);
      return dataUrl;
    }
  };

  const handleFilesSelect = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    setUploading(true);
    setError("");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < filesList.length; i++) {
        const url = await uploadSingleFile(filesList[i]);
        if (url) uploadedUrls.push(url);
      }
      onChange([...values, ...uploadedUrls]);
    } catch (err) {
      console.error("Error uploading images:", err);
      setError("Failed to upload some images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = values.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetMainCover = (indexToMain) => {
    if (indexToMain === 0) return;
    const targetUrl = values[indexToMain];
    const rest = values.filter((_, idx) => idx !== indexToMain);
    onChange([targetUrl, ...rest]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
          {label}
        </label>
        <span className="text-[11px] font-bold text-[var(--iris)] bg-[var(--fog)] px-2.5 py-1 rounded-full border border-[var(--line)]">
          {values.length} Image(s) Added
        </span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Image Thumbnails Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-[var(--fog)] rounded-2xl border border-[var(--line)]">
          {values.map((imgUrl, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden bg-slate-200 border group flex flex-col justify-between ${
                idx === 0 ? "border-[var(--iris)] ring-2 ring-[var(--iris)]/30" : "border-slate-300"
              }`}
            >
              <div className="relative w-full h-28 overflow-hidden bg-slate-900">
                <img
                  src={imgUrl}
                  alt={`Event Photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[var(--iris)] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> Cover Photo
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-rose-600/90 text-white p-1 rounded-lg hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetMainCover(idx)}
                  className="w-full bg-white text-[10px] font-bold text-slate-700 py-1 px-2 border-t border-slate-200 hover:bg-slate-50 transition-colors text-center cursor-pointer"
                >
                  Set as Main Cover
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone Button */}
      <div className="p-4 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-white transition-all text-center">
        {uploading ? (
          <div className="flex items-center justify-center gap-3 py-2 text-xs font-bold text-[#2B1F1A]">
            <div className="w-5 h-5 border-2 border-[var(--iris)] border-t-transparent rounded-full animate-spin" />
            <span>Processing & Uploading Images...</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <p className="text-xs font-bold text-[#2B1F1A]">Upload Multiple Event Photos</p>
              <p className="text-[11px] text-slate-400">Select one or multiple images at once (Posters, Venue, Guests)</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Images</span>
            </button>
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
