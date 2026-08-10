"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Link as LinkIcon, X, ExternalLink, RefreshCw } from "lucide-react";

export default function PdfPicker({
  value,
  onChange,
  label = "PDF Document / File *",
  required = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Verify PDF type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file (.pdf)");
      return;
    }

    setUploading(true);
    setError("");

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFileSize(`${sizeMB} MB`);
    setUploadedFileName(file.name);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary configuration missing! Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local file, or paste external link below.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.secure_url) {
        onChange(data.secure_url);
      } else {
        const errorMsg = data.error?.message || "Failed to upload PDF file.";
        setError(errorMsg);
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      setError("Network error occurred during PDF upload. Please try again or paste external link.");
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

  // Helper to extract a printable name from a URL
  const getDisplayName = () => {
    if (uploadedFileName) return uploadedFileName;
    if (!value) return "";
    try {
      const parts = value.split("/");
      const last = parts[parts.length - 1];
      return decodeURIComponent(last.split("?")[0]) || value;
    } catch {
      return value;
    }
  };

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
        accept="application/pdf"
        className="hidden"
      />

      {/* File Upload Box */}
      <div className="p-5 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-[var(--fog)] transition-all">
        {uploading ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-9 h-9 border-3 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[#2B1F1A]">Uploading PDF Document...</p>
            {uploadedFileName && (
              <p className="text-[11px] text-slate-400 font-mono mt-1 truncate max-w-xs">
                {uploadedFileName} ({uploadedFileSize})
              </p>
            )}
          </div>
        ) : value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Uploaded & Ready</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#2B1F1A] truncate mt-0.5" title={getDisplayName()}>
                    {getDisplayName()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={value}>
                    {uploadedFileSize ? `Size: ${uploadedFileSize} • ` : ""}{value}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {value && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="View PDF Document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-[#2B1F1A] hover:text-[var(--iris)] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Change PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setUploadedFileName("");
                    setUploadedFileSize("");
                    setError("");
                  }}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Remove PDF"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-rose-600 shadow-xs flex-shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#2B1F1A]">Select PDF from your PC</p>
                <p className="text-[11px] text-slate-400 font-medium">Select PDF document from your device (.pdf only)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
              Select PDF from PC
            </button>
          </div>
        )}
      </div>

      {/* Fallback Manual Link Input */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
          <LinkIcon className="w-3 h-3 text-slate-400" /> Paste existing link (Google Drive / DropBox / Cloud URL fallback):
        </span>
        <input
          type="url"
          required={required && !value}
          placeholder="https://drive.google.com/file/d/.../view"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setUploadedFileName("");
            setUploadedFileSize("");
            setError("");
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[var(--iris)] bg-white placeholder:text-slate-400"
        />
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
