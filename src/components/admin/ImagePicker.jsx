"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ImagePicker({ value, onChange, label = "Doctor Photo / Image", cropSquare = true }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Helper to convert file to compressed Data URL (Base64) as reliable fallback
  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Helper to auto-crop image into a clean 1:1 square focused on doctor's upper body / face
  const processAndCropSquare = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            if (!cropSquare) {
              // Return original aspect ratio compressed JPEG
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
              return;
            }

            const canvas = document.createElement("canvas");
            const targetSize = 500;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext("2d");

            let sx = 0;
            let sy = 0;
            let sWidth = img.naturalWidth;
            let sHeight = img.naturalHeight;

            if (img.naturalWidth > img.naturalHeight) {
              // Wide image: crop center square
              sWidth = img.naturalHeight;
              sx = (img.naturalWidth - sWidth) / 2;
            } else {
              // Tall portrait: crop square focusing 15% from top (head/face area)
              sHeight = img.naturalWidth;
              sy = Math.max(0, (img.naturalHeight - sHeight) * 0.15);
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetSize, targetSize);
            const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
            resolve(croppedDataUrl);
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

  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      // 1. Process and auto-crop into a 1:1 square centered on head/face
      const croppedDataUrl = await processAndCropSquare(file);
      const dataUrlToUse = croppedDataUrl || (await fileToDataURL(file));

      // 2. Attempt ImgBB upload
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "6d700a708235b3658f287854659b43e8";
      const formData = new FormData();
      formData.append("image", dataUrlToUse.replace(/^data:image\/\w+;base64,/, ""));

      try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success && data.data && (data.data.url || data.data.display_url)) {
          const remoteUrl = data.data.url || data.data.display_url;
          onChange(remoteUrl);
        } else {
          // Fallback to auto-cropped Data URL
          console.warn("ImgBB API warning, using Cropped Data URL fallback:", data.error);
          onChange(dataUrlToUse);
        }
      } catch (fetchErr) {
        console.warn("ImgBB fetch network issue, using Cropped Data URL fallback:", fetchErr);
        onChange(dataUrlToUse);
      }
    } catch (err) {
      console.error("File processing error:", err);
      setError("Failed to read image file. Please try another picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };



  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-4 p-4 bg-[var(--fog)] rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Image Ready & Selected</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-1 font-mono">
              {value.startsWith("data:") ? "Local Base64 Data URL (Saved in Firestore)" : value}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#2B1F1A] hover:text-[var(--iris)] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-[var(--fog)] transition-all">
          {uploading ? (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-9 h-9 border-3 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-[#2B1F1A]">Processing & Uploading Picture...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#2B1F1A]">{label || "Select Photograph / Image"}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP supported</p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-[var(--ink)] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[var(--iris-dark)] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Browse Image File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
