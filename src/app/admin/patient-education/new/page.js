"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, Sparkles, CheckCircle2, AlertCircle, BookOpen, Loader2 } from "lucide-react";
import ImagePicker from "@/components/admin/ImagePicker";
import dynamic from "next/dynamic";

const ArticleEditor = dynamic(() => import("@/components/admin/ArticleEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[350px] border border-slate-200 rounded-2xl p-6 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500">
      Loading Rich Text Editor...
    </div>
  ),
});

// Helper to convert title string to SEO friendly URL slug
const createSlug = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const PRESET_CATEGORIES = [
  "General Eye Health",
  "Cataract & Surgery",
  "LASIK & Refractive",
  "Glaucoma Care",
  "Pediatric Eye Care",
  "Retina & Diabetes",
  "Cornea & Dry Eye",
];

export default function AdminNewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("General Eye Health");
  const [customCategory, setCustomCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState("Published");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(createSlug(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for the article.");
      return;
    }

    if (!contentHtml.trim() || contentHtml === "<p></p>") {
      setError("Please write article content in the editor.");
      return;
    }

    setIsSaving(true);

    try {
      const finalCategory = category === "Custom" ? customCategory.trim() || "General" : category;
      const finalSlug = slug.trim() || createSlug(title);

      const articleData = {
        title: title.trim(),
        slug: finalSlug,
        category: finalCategory,
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || "",
        contentHtml: contentHtml,
        status: status,
        publishedAt: publishedAt || new Date().toISOString().split("T")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "articles"), articleData);
      router.push("/admin/patient-education");
    } catch (err) {
      console.error("Error saving article:", err);
      setError("Failed to save article. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/patient-education"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Patient Education Editor
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Article</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Article</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700">Article Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Understanding Cataract Surgery: Recovery & Expected Outcomes"
              value={title}
              onChange={handleTitleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">URL Slug *</label>
              <input
                type="text"
                required
                placeholder="e.g. understanding-cataract-surgery"
                value={slug}
                onChange={(e) => setSlug(createSlug(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-700 focus:outline-none focus:border-[var(--iris)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Add Custom Category...</option>
              </select>

              {category === "Custom" && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
                />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700">Short Excerpt / Summary</label>
            <textarea
              rows={2}
              placeholder="Brief summary displayed on article cards..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:border-[var(--iris)]"
            />
          </div>
        </div>

        {/* Featured Banner Image */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-extrabold text-slate-700">Featured Top Banner Image (Optional)</label>
          <ImagePicker value={featuredImage} onChange={setFeaturedImage} />
        </div>

        {/* Rich Text Editor Body */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-extrabold text-slate-700">Article Body Content *</label>
          <ArticleEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            href="/admin/patient-education"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Publish Article Now</span>
          </button>
        </div>
      </form>
    </div>
  );
}
