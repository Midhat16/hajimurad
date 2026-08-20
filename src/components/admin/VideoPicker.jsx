"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Video, CheckCircle2, AlertCircle, Link as LinkIcon, X, ExternalLink, Play } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";

export function getYoutubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const target = url.trim();

  // Handles youtube.com/watch?v=ID or youtube.com/embed/ID or youtu.be/ID or youtube.com/shorts/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = target.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
}

export function isDirectVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const str = url.trim().toLowerCase();
  if (str.startsWith("data:video/")) return true;
  if (str.endsWith(".mp4") || str.endsWith(".webm") || str.endsWith(".ogg") || str.endsWith(".mov")) return true;
  if (str.includes(".mp4?") || str.includes(".webm?")) return true;
  if (str.includes("cloudinary.com") || str.includes("firebasestorage.googleapis.com")) return true;
  return false;
}

export default function VideoPicker({
  value,
  onChange,
  label = "Patient Video / Media (Optional)",
  required = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setUploading(true);
    setError("");
    setUploadProgress("Uploading video file directly to Cloudinary cloud server...");

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);
    setFileName(file.name);

    try {
      // 1. Primary: Cloudinary Video Upload
      try {
        const cloudinaryUrl = await uploadMediaToCloudinary(file, "video");
        if (cloudinaryUrl && !cloudinaryUrl.startsWith("data:")) {
          onChange(cloudinaryUrl);
          setUploading(false);
          setUploadProgress("");
          return;
        }
      } catch (cErr) {
        console.warn("Cloudinary video upload notice, trying Firebase Storage:", cErr);
      }

      // 2. Secondary Fallback: Firebase Storage Binary Upload
      setUploadProgress("Uploading video to Firebase Storage...");
      try {
        const sanitizeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `uploads/videos/${Date.now()}_${sanitizeName}`;
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        if (downloadUrl) {
          onChange(downloadUrl);
          setUploading(false);
          setUploadProgress("");
          return;
        }
      } catch (fbErr) {
        console.warn("Firebase Storage video upload notice:", fbErr);
      }

      // Safeguard: Never store raw Base64 data URL for videos in Firestore to avoid 1MB document size errors
      setError("Video upload failed. Please verify your internet connection or paste a YouTube / video link instead.");
    } catch (err) {
      console.error("Video upload process error:", err);
      setError("Failed to upload video file. Please try again or paste a video link.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const isBase64 = value && value.startsWith("data:");
  const youtubeEmbed = getYoutubeEmbedUrl(value);
  const isVideoFile = isDirectVideoUrl(value);

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-[#2B1F1A] block">
        {label}
      </label>

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
        className="hidden"
      />

      {/* Selector Box */}
      <div className="p-5 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-[var(--fog)] transition-all">
        {uploading ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-extrabold text-[#2B1F1A]">Uploading Video File...</p>
            <p className="text-[11px] font-semibold text-purple-700 mt-1">
              {uploadProgress || "Uploading directly to Cloudinary cloud hosting..."}
            </p>
          </div>
        ) : value ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Cloud Video Attached Successfully</span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#2B1F1A] truncate mt-0.5 font-mono">
                    {fileName || value}
                  </p>
                  {fileSize && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Size: {fileSize}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-[#2B1F1A] hover:text-[var(--iris)] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Change Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setFileName("");
                    setFileSize("");
                  }}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Remove Video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Video Preview Box */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-black/90 aspect-video relative max-h-56 flex items-center justify-center mx-auto">
              {isVideoFile || isBase64 ? (
                <video
                  src={value}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                />
              ) : youtubeEmbed ? (
                <iframe
                  src={youtubeEmbed}
                  title="YouTube Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-4 text-white">
                  <Play className="w-8 h-8 mx-auto text-purple-400 mb-1" />
                  <p className="text-xs font-bold truncate max-w-md">{value}</p>
                  <span className="text-[10px] text-slate-400">External Video Link Attached</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-purple-600 shadow-xs flex-shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2B1F1A]">Upload Video File to Cloudinary</p>
                <p className="text-[11px] text-slate-400 font-medium">MP4, WEBM, MOV video files supported</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-[#1E1433] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <Video className="w-4 h-4" />
              Browse PC Video File
            </button>
          </div>
        )}
      </div>

      {/* Alternative URL Input */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
          <LinkIcon className="w-3 h-3 text-slate-400" /> Or Paste Video / Social Media Link (YouTube, Instagram, Facebook, TikTok, Cloud URL):
        </span>
        <input
          type="url"
          required={required && !value}
          placeholder="https://www.youtube.com/watch?v=... or https://res.cloudinary.com/..."
          value={isBase64 ? "" : value}
          onChange={(e) => {
            onChange(e.target.value);
            setFileName("");
            setFileSize("");
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white placeholder:text-slate-400"
        />
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
