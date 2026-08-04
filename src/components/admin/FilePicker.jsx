"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Link as LinkIcon, X, ExternalLink } from "lucide-react";

export default function FilePicker({
  value,
  onChange,
  label = "PDF Document / File *",
  required = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    setUploading(true);
    setError("");

    // Calculate file size display
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      onChange(dataUrl);
      setUploading(false);
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError("Failed to read file from your PC. Please try again.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const isBase64 = value && value.startsWith("data:");

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-[var(--ink)] block">
        {label}
      </label>

      {/* Hidden Native PC File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,application/pdf,image/*,.doc,.docx"
        className="hidden"
      />

      {/* PC File Selector Box */}
      <div className="p-5 border-2 border-dashed border-[var(--line)] hover:border-[var(--iris)] rounded-2xl bg-[var(--fog)] transition-all">
        {uploading ? (
          <div className="flex flex-col items-center py-3 text-center">
            <div className="w-8 h-8 border-3 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-bold text-[var(--ink)]">Reading file from PC...</p>
          </div>
        ) : value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--fog)] border border-[var(--line)] flex items-center justify-center text-[var(--iris)] flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">File Selected Successfully</span>
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--ink)] truncate mt-0.5">
                    {fileName || (isBase64 ? "Local PC File Attached" : value)}
                  </p>
                  {fileSize && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Size: {fileSize}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!isBase64 && value && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Open Document Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:text-[var(--iris)] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setFileName("");
                    setFileSize("");
                  }}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-[var(--line)] flex items-center justify-center text-[var(--iris)] shadow-xs flex-shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Select File from your Computer / Device</p>
                <p className="text-[11px] text-slate-400 font-medium">PDF, DOC, DOCX, Images supported</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
              Browse PC File
            </button>
          </div>
        )}
      </div>

      {/* Alternative URL input */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
          <LinkIcon className="w-3 h-3 text-slate-400" /> Or Enter External Document / Cloud Link (Google Drive / DropBox / Web URL):
        </span>
        <input
          type="url"
          required={required && !value}
          placeholder="https://drive.google.com/file/d/.../view"
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
