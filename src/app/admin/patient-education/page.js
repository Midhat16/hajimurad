"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPatientEducationPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "articles"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.createdAt?.seconds * 1000 || 0);
          const dateB = new Date(b.publishedAt || b.createdAt?.seconds * 1000 || 0);
          return dateB - dateA;
        });
        setArticles(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Admin articles listener notice:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    try {
      // 1. Delete from primary articles collection
      try {
        await deleteDoc(doc(db, "articles", id));
      } catch (e) {}

      // 2. Delete from legacy newsletters collection if present
      try {
        await deleteDoc(doc(db, "newsletters", id));
      } catch (e) {}

      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete article:", err);
      alert("Error deleting article: " + err.message);
    }
  };

  const toggleStatus = async (article) => {
    try {
      const newStatus = article.status === "Published" ? "Draft" : "Published";
      try {
        await fetch(`/api/articles/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (e) {
        await updateDoc(doc(db, "articles", article.id), {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert("Error updating status: " + err.message);
    }
  };

  const categories = ["All", ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      (art.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || art.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || art.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1E1433] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#5EEAD4]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Patient Education & Articles
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm max-w-xl">
            Publish educational articles, cataract guides, LASIK recovery tips, and eye health news for patients.
          </p>
        </div>

        <Link
          href="/admin/patient-education/new"
          className="inline-flex items-center justify-center gap-2 bg-[#C4232C] hover:bg-[#a81c24] text-white font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg transition-all cursor-pointer shrink-0 border border-white/20"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Write New Article</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search article title or text..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[var(--iris)]"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold"
            >
              <option value="All">Status: All</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table / Cards List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-extrabold text-[#2B1F1A] uppercase tracking-wider">
            Loading Articles...
          </p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Patient Education Articles Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== "All" || selectedStatus !== "All"
              ? "No articles match your current search or category filter. Try clearing filters."
              : "You haven't created any patient education articles yet. Click 'Write New Article' to compose your first post."}
          </p>
          <Link
            href="/admin/patient-education/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[var(--iris-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Article</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cover Image Header (Optional) */}
                <div className="relative h-44 bg-slate-100 border-b border-slate-100 overflow-hidden">
                  {art.featuredImage ? (
                    <Image
                      src={art.featuredImage}
                      alt={art.title || "Featured Cover"}
                      width={300}
                      height={176}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <BookOpen className="w-8 h-8 mb-1.5 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-400">No Cover Image (Text Only)</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(art)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                        art.status === "Published"
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                      title="Click to toggle Draft / Published"
                    >
                      {art.status === "Published" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Category Tag */}
                  {art.category && (
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-[#1E1433]/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        {art.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Article Info Content */}
                <div className="p-5 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    Published: {art.publishedAt || new Date(art.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                  <h3 className="text-base font-extrabold text-[#2B1F1A] line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium">
                    {art.excerpt || "No summary excerpt added."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/patient-education/edit?id=${art.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-xl text-xs font-extrabold hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </Link>

                {art.status === "Published" && art.slug && (
                  <Link
                    href={`/patient-education/${art.slug}`}
                    target="_blank"
                    className="p-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                    title="View Public Article"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                  </Link>
                )}

                {deleteConfirmId === art.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(art.id)}
                      className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-2 rounded-xl hover:bg-rose-700"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(art.id)}
                    className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
