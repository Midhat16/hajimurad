"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

function PdfViewerClient() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url");

  const [decodedUrl, setDecodedUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rawUrl) {
      try {
        const url = decodeURIComponent(rawUrl);
        setDecodedUrl(url);
      } catch (err) {
        setDecodedUrl(rawUrl);
      }
    }
    setLoading(false);
  }, [rawUrl]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-[#5EEAD4] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-extrabold text-white uppercase tracking-wider">
          Loading Document Viewer...
        </p>
      </div>
    );
  }

  if (!decodedUrl) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans text-white">
        <FileText className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-lg font-extrabold text-white">Invalid Document Link</h2>
        <p className="text-xs text-slate-400 mt-1">
          The requested document URL is missing or corrupted.
        </p>
      </div>
    );
  }

  return (
    <iframe
      src={decodedUrl}
      title="Haji Murad Hospital Medical Publication"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "block",
      }}
    />
  );
}

export default function PdfViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
          <div className="w-10 h-10 border-4 border-[#5EEAD4] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-extrabold text-white uppercase tracking-wider">
            Loading Document Viewer...
          </p>
        </div>
      }
    >
      <PdfViewerClient />
    </Suspense>
  );
}
