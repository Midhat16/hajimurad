"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Check,
  AlertCircle
} from "lucide-react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_FAQS } from "@/lib/defaultFaqs";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    order: 1,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let faqsMap = new Map();
    let newslettersMap = new Map();
    let siteContentMap = new Map();

    const updateCombinedFaqs = () => {
      const allItems = [
        ...Array.from(faqsMap.values()),
        ...Array.from(newslettersMap.values()),
        ...Array.from(siteContentMap.values()),
      ];

      if (allItems.length === 0) {
        setFaqs(DEFAULT_FAQS.map((item) => ({ ...item, isDefaultTemplate: true })));
        setLoading(false);
        return;
      }

      // Deduplicate by question string
      const uniqueFaqs = new Map();
      allItems.forEach((item) => {
        const key = (item.question || "").toLowerCase().trim();
        if (key && !uniqueFaqs.has(key)) {
          uniqueFaqs.set(key, item);
        }
      });

      const list = Array.from(uniqueFaqs.values());
      list.sort((a, b) => (a.order || 99) - (b.order || 99));
      setFaqs(list);
      setLoading(false);
    };

    const unsubFaqs = onSnapshot(
      collection(db, "faqs"),
      (snap) => {
        faqsMap.clear();
        snap.docs.forEach((d) => faqsMap.set(d.id, { id: d.id, ...d.data() }));
        updateCombinedFaqs();
      },
      (err) => console.warn("Admin faqs notice:", err)
    );

    const unsubNewsletters = onSnapshot(
      collection(db, "newsletters"),
      (snap) => {
        newslettersMap.clear();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.question || data.type === "faq" || data.isFaq) {
            newslettersMap.set(d.id, { id: d.id, ...data });
          }
        });
        updateCombinedFaqs();
      },
      (err) => console.warn("Admin newsletters faqs notice:", err)
    );

    const unsubSiteContent = onSnapshot(
      collection(db, "siteContent"),
      (snap) => {
        siteContentMap.clear();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.question || data.type === "faq" || data.isFaq || d.id.startsWith("faq_")) {
            siteContentMap.set(d.id, { id: d.id, ...data });
          }
        });
        updateCombinedFaqs();
      },
      (err) => console.warn("Admin siteContent faqs notice:", err)
    );

    return () => {
      unsubFaqs();
      unsubNewsletters();
      unsubSiteContent();
    };
  }, []);

  // Open modal for new FAQ
  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: "General",
      order: faqs.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question || "",
      answer: faq.answer || "",
      category: faq.category || "General",
      order: faq.order || 1,
      isActive: faq.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Save (Add or Update) FAQ EXCLUSIVELY into 'faqs' collection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setMessage({ type: "error", text: "Please enter both Question and Answer." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: formData.category.trim() || "General",
      order: Number(formData.order) || (faqs.length + 1),
      isActive: formData.isActive,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingFaq && !editingFaq.isDefaultTemplate) {
        // Update existing DB doc in faqs collection
        const targetId = editingFaq.id;
        await setDoc(doc(db, "faqs", targetId), payload, { merge: true });
        setMessage({ type: "success", text: "FAQ updated in 'faqs' collection successfully!" });
      } else {
        // Add new FAQ or save edited default FAQ directly into faqs collection
        const newPayload = {
          ...payload,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, "faqs"), newPayload);
        setMessage({ type: "success", text: "FAQ saved to 'faqs' collection successfully!" });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving FAQ:", err);
      setMessage({ type: "error", text: "Failed to save FAQ. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (faq) => {
    const newStatus = !faq.isActive;

    if (faq.isDefaultTemplate) {
      try {
        const payload = {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          order: faq.order,
          isActive: newStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, "faqs"), payload);
      } catch (err) {
        console.error("Error toggling active state:", err);
      }
      return;
    }

    try {
      await updateDoc(doc(db, "faqs", faq.id), { isActive: newStatus, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("Error toggling active state:", err);
    }
  };

  // Delete FAQ - removes from 'faqs' AND legacy 'newsletters' collection
  const handleDelete = async (faq) => {
    if (!window.confirm("Are you sure you want to delete this FAQ? It will be removed permanently.")) return;

    if (faq.isDefaultTemplate) {
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
      setMessage({ type: "success", text: "Default FAQ removed from view." });
      return;
    }

    try {
      const targetId = faq.id;
      // 1. Delete from primary faqs collection
      try {
        await deleteDoc(doc(db, "faqs", targetId));
      } catch (e) {}

      // 2. Also delete from legacy newsletters collection if present
      try {
        await deleteDoc(doc(db, "newsletters", targetId));
      } catch (e) {}

      setMessage({ type: "success", text: "FAQ deleted permanently from database." });
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      setMessage({ type: "error", text: "Failed to delete FAQ." });
    }
  };

  // Batch seed default 10 FAQs directly into 'faqs' collection
  const handleSeedDefaults = async () => {
    if (!window.confirm("Seed default 10 hospital FAQs into the 'faqs' Firestore collection?")) return;
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      let successCount = 0;
      for (const item of DEFAULT_FAQS) {
        const payload = {
          question: item.question,
          answer: item.answer,
          category: item.category,
          order: item.order,
          isActive: item.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, "faqs"), payload);
        successCount++;
      }

      setMessage({ type: "success", text: `${successCount} Default FAQs saved to 'faqs' collection successfully!` });
    } catch (err) {
      console.error("Error seeding FAQs:", err);
      setMessage({ type: "error", text: "Failed to seed default FAQs." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthenticatedMigration = async () => {
    if (!window.confirm("Move all FAQ documents from 'newsletters' into 'faqs' and article documents from 'siteContent' into 'articles'?")) return;
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const newsSnap = await getDocs(collection(db, "newsletters"));
      let faqsMigrated = 0;
      const seenFaqKeys = new Set();

      for (const docSnap of newsSnap.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;

        if (data.question || data.type === "faq" || data.isFaq) {
          const key = (data.question || "").toLowerCase().trim();
          if (!seenFaqKeys.has(key)) {
            seenFaqKeys.add(key);
            await setDoc(doc(db, "faqs", docId), data);
            faqsMigrated++;
          }
          await deleteDoc(doc(db, "newsletters", docId));
        }
      }

      const scSnap = await getDocs(collection(db, "siteContent"));
      let articlesMigrated = 0;

      for (const docSnap of scSnap.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;

        if (data.contentHtml || data.type === "article" || docId === "8faqwJNUA0PHzovYNWpG") {
          await setDoc(doc(db, "articles", docId), data);
          await deleteDoc(doc(db, "siteContent", docId));
          articlesMigrated++;
        }
      }

      setMessage({
        type: "success",
        text: `Migration Successful! ${faqsMigrated} FAQs moved to 'faqs', ${articlesMigrated} Article moved to 'articles'.`,
      });
    } catch (err) {
      console.error("Migration error:", err);
      setMessage({ type: "error", text: "Migration failed: " + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category || "General")))];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      (faq.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.answer || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-purple-700 bg-purple-50 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" /> FAQ Management Desk
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Add, edit, or reorder questions. Saved directly in top-level <code className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">faqs</code> collection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Custom FAQ</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ type: "", text: "" })}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[var(--iris)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">Filter Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[var(--ink)] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs List Table / Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw className="w-8 h-8 text-[var(--iris)] animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading Frequently Asked Questions...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Info className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No Questions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            No FAQs match your search or filter. Click 'Load / Seed 10 Default FAQs' to populate default hospital questions into the 'faqs' collection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={faq.id || idx}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs space-y-3 ${
                faq.isActive === false
                  ? "border-slate-200 opacity-60 bg-slate-50"
                  : "border-slate-200 hover:border-purple-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    #{faq.order || idx + 1}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {faq.category || "General"}
                  </span>
                  {faq.isDefaultTemplate && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                      Default Hospital System FAQ
                    </span>
                  )}
                  {faq.isActive === false ? (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                      Hidden / Inactive
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md">
                      Live / Active
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      faq.isActive === false
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                    title={faq.isActive === false ? "Activate Question" : "Hide Question"}
                  >
                    {faq.isActive === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(faq)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(faq)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question & Answer Content */}
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Q: {faq.question}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed pl-4 border-l-2 border-purple-300">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingFaq ? "Edit FAQ" : "Add New Custom FAQ"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Question Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How long does cataract surgery take?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              {/* Category & Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Cataract & Surgery"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[var(--iris)]"
                  />
                </div>
              </div>

              {/* Answer */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Answer *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed, patient-friendly answer..."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:border-[var(--iris)]"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[var(--iris)] rounded cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Display on public FAQs page (Active)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-[var(--ink)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingFaq ? "Update FAQ" : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
