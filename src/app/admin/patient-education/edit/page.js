"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
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

function EditArticleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!articleId) {
      setError("No article ID provided.");
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        let data = null;
        let found = false;

        // 1. Try articles collection
        try {
          const docRef = doc(db, "articles", articleId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data = docSnap.data();
            found = true;
          }
        } catch (e) {
          console.warn("Articles collection read notice:", e);
        }

        // 2. Try newsletters collection fallback
        if (!found) {
          try {
            const docRefN = doc(db, "newsletters", articleId);
            const docSnapN = await getDoc(docRefN);
            if (docSnapN.exists()) {
              data = docSnapN.data();
              found = true;
            }
          } catch (e) {
            console.warn("Newsletters collection read notice:", e);
          }
        }

        if (found && data) {
          setTitle(data.title || "");
          setSlug(data.slug || createSlug(data.title || ""));
          setExcerpt(data.excerpt || "");
          setFeaturedImage(data.featuredImage || "");
          setContentHtml(data.contentHtml || "");
          setStatus(data.status || "Published");
          setPublishedAt(data.publishedAt || new Date().toISOString().split("T")[0]);

          const cat = data.category || "General Eye Health";
          if (PRESET_CATEGORIES.includes(cat)) {
            setCategory(cat);
          } else {
            setCategory("Custom");
            setCustomCategory(cat);
          }
        } else {
          setError("Article not found.");
        }
      } catch (err) {
        console.error("Error loading article:", err);
        setError("Failed to load article: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

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

      const updateData = {
        title: title.trim(),
        slug: finalSlug,
        category: finalCategory,
        excerpt: excerpt.trim(),
        featuredImage: featuredImage || "",
        contentHtml: contentHtml,
        status: status,
        publishedAt: publishedAt,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "articles", articleId), updateData, { merge: true });
      router.push("/admin/patient-education");
    } catch (err) {
      console.error("Error updating article:", err);
      setError("Failed to update article: " + err.message);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Loader2 className="w-10 h-10 border-4 text-[var(--iris)] animate-spin mx-auto mb-4" />
          <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
            Loading Article Editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/patient-education"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[11px] font-bold text-[var(--iris)] uppercase tracking-wider block">
              Patient Education
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#2B1F1A]">Edit Article</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white font-extrabold px-7 py-3 rounded-2xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Updating Article..." : "Update Article"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block mb-1.5">
              Article Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(createSlug(e.target.value));
              }}
              placeholder="Article title..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              URL Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 shrink-0 hidden sm:inline-block">
                /patient-education/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-[var(--iris)]"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)] cursor-pointer"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category</option>
              </select>

              {category === "Custom" && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name..."
                  className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)] cursor-pointer"
              >
                <option value="Published">Published (Public)</option>
                <option value="Draft">Draft (Hidden)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block mb-1.5">
                Publish Date
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block mb-1.5">
              Short Excerpt / Summary
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[var(--iris)] leading-relaxed"
            />
          </div>

          {/* Optional Featured Image */}
          <div className="pt-2">
            <ImagePicker
              value={featuredImage}
              onChange={setFeaturedImage}
              label="Featured Cover Image (Optional)"
              cropSquare={false}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
            Article Body Content <span className="text-rose-500">*</span>
          </label>
          <ArticleEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white font-black px-8 py-4 rounded-2xl text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4.5 h-4.5" />
            <span>{isSaving ? "Updating Article..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminEditArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Loader2 className="w-10 h-10 text-[var(--iris)] animate-spin mx-auto mb-4" />
            <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
              Loading Editor...
            </p>
          </div>
        </div>
      }
    >
      <EditArticleContent />
    </Suspense>
  );
}
