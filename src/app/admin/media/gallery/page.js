"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import {
  FolderPlus,
  FolderOpen,
  Image as ImageIcon,
  Edit3,
  Trash2,
  ArrowLeft,
  CheckSquare,
  Square,
  UploadCloud,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to upload image file to Cloudinary or Firebase Storage
const processAndUploadFile = async (file) => {
  if (!file) return "";

  // 1. Try Cloudinary upload
  try {
    const url = await uploadMediaToCloudinary(file);
    if (url) return url;
  } catch (err) {
    console.warn("Cloudinary upload failed, falling back to Firebase Storage:", err);
  }

  // 2. Fallback: Firebase Storage
  try {
    const storagePath = `uploads/gallery/${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    if (downloadUrl) return downloadUrl;
  } catch (fbErr) {
    console.warn("Firebase Storage upload notice:", fbErr);
  }

  return "";
};

export default function AdminGalleryPage() {
  const [dbCategories, setDbCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category View state: null = Main Categories View, string = Selected Category Name
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Selection Mode and Multi-Image Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState([]);

  // Category Creation state
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Category Rename Modal state
  const [editingCategory, setEditingCategory] = useState(null); // { id, oldName, newName }
  const [isRenaming, setIsRenaming] = useState(false);

  // Multi-Photo Upload Modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]); // [{ id, file, previewUrl, caption }]
  const [order, setOrder] = useState(1);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // General Notification & Error states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef(null);

  // Reset multi-select & selection mode whenever category view changes
  useEffect(() => {
    setSelectedImageIds([]);
    setIsSelectionMode(false);
  }, [selectedCategory]);

  // Fetch category documents directly from 'galleryImages' collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "galleryImages"),
      (snap) => {
        const catList = [];
        const allImagesList = [];

        snap.docs.forEach((d) => {
          const data = d.data();
          const catName = data.categoryName || d.id;
          catList.push({ id: d.id, name: catName });

          const imgArr = Array.isArray(data.images) ? data.images : [];
          imgArr.forEach((img) => {
            const url = img.url || img.imageUrl || img.src || "";
            if (url) {
              allImagesList.push({
                id: img.id || Math.random().toString(),
                imageUrl: url,
                caption: img.caption || "",
                category: catName,
                order: Number(img.order) || 1,
                createdAt: img.createdAt || null,
              });
            }
          });
        });

        allImagesList.sort((a, b) => (a.order || 0) - (b.order || 0));

        setDbCategories(catList);
        setImages(allImagesList);
        setLoading(false);
      },
      (err) => {
        console.warn("Error subscribing to galleryImages:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Compute category map
  const categoryMap = new Map();
  dbCategories.forEach((cat) => {
    if (cat.name) {
      categoryMap.set(cat.name, { id: cat.id, name: cat.name });
    }
  });
  images.forEach((img) => {
    if (img.category && !categoryMap.has(img.category)) {
      categoryMap.set(img.category, { id: img.category, name: img.category });
    }
  });
  const allCategories = Array.from(categoryMap.values());

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // Create Category Handler
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }

    if (categoryMap.has(trimmed)) {
      setError(`Category "${trimmed}" already exists.`);
      return;
    }

    setIsCreatingCategory(true);
    try {
      await setDoc(doc(db, "galleryImages", trimmed), {
        categoryName: trimmed,
        images: [],
        updatedAt: serverTimestamp(),
      });
      setNewCatName("");
      triggerSuccess(`Category "${trimmed}" created successfully!`);
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err?.message || "Failed to create category.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Rename Category Handler
  const handleRenameCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setError("");

    const oldName = editingCategory.oldName;
    const newName = editingCategory.newName.trim();

    if (!newName) {
      setError("Category name cannot be empty.");
      return;
    }

    if (newName === oldName) {
      setEditingCategory(null);
      return;
    }

    setIsRenaming(true);
    try {
      const oldRef = doc(db, "galleryImages", oldName);
      const oldSnap = await getDoc(oldRef);
      const existingImages = oldSnap.exists() && Array.isArray(oldSnap.data().images) ? oldSnap.data().images : [];

      await setDoc(doc(db, "galleryImages", newName), {
        categoryName: newName,
        images: existingImages,
        updatedAt: serverTimestamp(),
      });

      await deleteDoc(oldRef).catch(() => {});

      if (selectedCategory === oldName) {
        setSelectedCategory(newName);
      }

      setEditingCategory(null);
      triggerSuccess(`Category renamed to "${newName}"!`);
    } catch (err) {
      console.error("Error renaming category:", err);
      setError(err?.message || "Failed to rename category.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catObj, e) => {
    e?.stopPropagation();
    setError("");
    const catName = catObj.name;
    const categoryPhotos = images.filter((img) => img.category === catName);
    const photoCount = categoryPhotos.length;

    let confirmMsg = `Are you sure you want to delete category "${catName}"?`;
    if (photoCount > 0) {
      confirmMsg = `Category "${catName}" contains ${photoCount} photo(s).\n\nDeleting this category will ALSO delete all ${photoCount} photo(s) inside it.\n\nDo you want to proceed?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, "galleryImages", catName));

      if (selectedCategory === catName) {
        setSelectedCategory(null);
      }

      triggerSuccess(`Category "${catName}" and its photos were deleted.`);
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category.");
    }
  };

  // Multiple File Selection Handler
  const handleFilesSelected = (e) => {
    const filesArray = Array.from(e.target.files || []);
    if (filesArray.length === 0) return;

    const newItems = filesArray.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
    }));

    setBatchFiles((prev) => [...prev, ...newItems]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFileFromBatch = (idToRemove) => {
    setBatchFiles((prev) => {
      const item = prev.find((i) => i.id === idToRemove);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== idToRemove);
    });
  };

  // Batch Photo Upload & Save Handler
  const handleSaveBatchPhotos = async (e) => {
    e.preventDefault();
    setError("");

    if (batchFiles.length === 0) {
      setError("Please select at least one photo to upload.");
      return;
    }
    if (!selectedCategory) {
      setError("No active category selected.");
      return;
    }

    setIsUploadingBatch(true);
    const total = batchFiles.length;
    setUploadProgress({ current: 0, total });

    try {
      const targetRef = doc(db, "galleryImages", selectedCategory);
      const targetSnap = await getDoc(targetRef);
      const currentImages = targetSnap.exists() && Array.isArray(targetSnap.data().images) ? [...targetSnap.data().images] : [];
      let baseOrder = Number(order) || 1;

      for (let i = 0; i < total; i++) {
        setUploadProgress({ current: i + 1, total });
        const item = batchFiles[i];

        const finalImageUrl = await processAndUploadFile(item.file);

        if (finalImageUrl) {
          currentImages.push({
            id: item.id || Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            url: finalImageUrl,
            caption: item.caption.trim(),
            order: baseOrder + i,
            createdAt: new Date().toISOString(),
          });
        }
      }

      await setDoc(targetRef, {
        categoryName: selectedCategory,
        images: currentImages,
        updatedAt: serverTimestamp(),
      });

      batchFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });

      triggerSuccess(`Successfully uploaded ${total} photo(s) live to "${selectedCategory}"!`);

      setBatchFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      setIsPhotoModalOpen(false);
    } catch (err) {
      console.error("Error during batch upload:", err);
      setError(err?.message || "Failed to upload photos. Please try again.");
    } finally {
      setIsUploadingBatch(false);
    }
  };

  // Delete Single Photo Handler
  const handleDeletePhoto = async (photoId) => {
    if (!selectedCategory || !window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      const targetRef = doc(db, "galleryImages", selectedCategory);
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const currentImages = Array.isArray(targetSnap.data().images) ? targetSnap.data().images : [];
        const updatedImages = currentImages.filter((img) => img.id !== photoId);

        await setDoc(targetRef, {
          categoryName: selectedCategory,
          images: updatedImages,
          updatedAt: serverTimestamp(),
        });
      }

      setSelectedImageIds((prev) => prev.filter((id) => id !== photoId));
      triggerSuccess("Photo removed from gallery.");
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert("Failed to delete photo.");
    }
  };

  // Multi-Photo Selection & Batch Deletion Logic
  const toggleSelectPhoto = (photoId) => {
    setSelectedImageIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAllPhotos = (currentCategoryPhotos) => {
    if (selectedImageIds.length === currentCategoryPhotos.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(currentCategoryPhotos.map((p) => p.id));
    }
  };

  const handleDeleteSelectedPhotos = async (currentCategoryPhotos) => {
    if (selectedImageIds.length === 0 || !selectedCategory) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the ${selectedImageIds.length} selected photo(s)?`
      )
    ) {
      return;
    }

    try {
      const targetRef = doc(db, "galleryImages", selectedCategory);
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const currentImages = Array.isArray(targetSnap.data().images) ? targetSnap.data().images : [];
        const deleteSet = new Set(selectedImageIds);
        const updatedImages = currentImages.filter((img) => !deleteSet.has(img.id));

        await setDoc(targetRef, {
          categoryName: selectedCategory,
          images: updatedImages,
          updatedAt: serverTimestamp(),
        });
      }

      setSelectedImageIds([]);
      setIsSelectionMode(false);
      triggerSuccess("Selected photo(s) deleted successfully.");
    } catch (err) {
      console.error("Error deleting selected photos:", err);
      alert("Failed to delete selected photos.");
    }
  };

  const currentCategoryPhotos = images.filter((img) => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--fog)] p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-[var(--line)] p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--iris)]/10 text-[var(--iris)] text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Media Infrastructure
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2B1F1A] tracking-tight">
            {selectedCategory ? `Gallery: ${selectedCategory}` : "Hospital Gallery Manager"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-2xl leading-relaxed">
            {selectedCategory
              ? `Manage, upload, or organize photos in the '${selectedCategory}' category.`
              : "Organize outpatient clinic photos, diagnostic machinery, surgical procedures, and community outreach eye camps into custom categories."}
          </p>
        </div>

        {/* Global Action Header Button */}
        {selectedCategory ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setError("");
                setSelectedCategory(null);
              }}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--ink)] hover:text-[var(--iris)] bg-[var(--fog)] px-4 py-3 rounded-2xl border border-[var(--line)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Categories
            </button>

            <button
              onClick={() => {
                setError("");
                setBatchFiles([]);
                setIsPhotoModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--ink)] to-[var(--iris)] text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4.5 h-4.5 text-[#5EEAD4]" />
              <span>Add Photos to {selectedCategory}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New Category Name..."
                className="px-4 py-2.5 rounded-2xl border border-[var(--line)] text-xs font-medium focus:ring-2 focus:ring-[var(--iris)] focus:outline-none bg-slate-50 w-48 sm:w-64"
              />
              <button
                type="submit"
                disabled={isCreatingCategory || !newCatName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Global Alerts & Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Content Loader */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--iris)] border-t-transparent rounded-full animate-spin" />
          <span>Loading Gallery Data...</span>
        </div>
      ) : !selectedCategory ? (
        /* ========================================================================= */
        /* VIEW 1: CATEGORIES GRID VIEW                                              */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[#2B1F1A]">
              Active Categories ({allCategories.length})
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Total Gallery Photos: {images.length}
            </span>
          </div>

          {allCategories.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-[var(--line)] shadow-xs max-w-lg mx-auto p-8 space-y-4">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-slate-800 font-extrabold text-base">No Gallery Categories Created</p>
                <p className="text-slate-400 text-xs font-medium">
                  Create your first category above (e.g. "Surgical Camps", "Outpatient Clinics", "Diagnostics").
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allCategories.map((cat) => {
                const count = images.filter((img) => img.category === cat.name).length;
                return (
                  <motion.div
                    key={cat.name}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setError("");
                      setSelectedCategory(cat.name);
                    }}
                    className="bg-white rounded-3xl border border-[var(--line)] p-6 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--iris)]/10 text-[var(--iris)] flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                          <FolderOpen className="w-6 h-6" />
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory({ id: cat.id, oldName: cat.name, newName: cat.name });
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Rename Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCategory(cat, e)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[var(--iris)] transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          {count} {count === 1 ? "Photo" : "Photos"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[var(--iris)]">
                      <span>Manage Category Photos</span>
                      <span>&rarr;</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: DEDICATED CATEGORY IMAGE MANAGEMENT VIEW                          */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Breadcrumb Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[var(--line)] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setError("");
                  setSelectedCategory(null);
                }}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--ink)] hover:text-[var(--iris)] bg-[var(--fog)] px-3.5 py-2 rounded-xl border border-[var(--line)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Categories
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#2B1F1A] tracking-tight">
                    Category: {selectedCategory}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--iris)]/10 text-[var(--iris)] px-2.5 py-0.5 rounded-full border border-[var(--iris)]/20">
                    {currentCategoryPhotos.length} {currentCategoryPhotos.length === 1 ? "Photo" : "Photos"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Toolbar Controls */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedImageIds([]);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isSelectionMode
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{isSelectionMode ? "Exit Select Mode" : "Multi-Select Photos"}</span>
              </button>

              {isSelectionMode && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectAllPhotos(currentCategoryPhotos)}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    {selectedImageIds.length === currentCategoryPhotos.length ? "Deselect All" : "Select All"}
                  </button>

                  {selectedImageIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSelectedPhotos(currentCategoryPhotos)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete ({selectedImageIds.length})</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Category Photos Grid */}
          {currentCategoryPhotos.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-[var(--line)] shadow-xs max-w-md mx-auto p-8 space-y-4">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-slate-800 font-extrabold text-base">No Photos in "{selectedCategory}"</p>
                <p className="text-slate-400 text-xs font-medium">
                  Click the button below to upload multiple photos into this category.
                </p>
              </div>
              <button
                onClick={() => {
                  setError("");
                  setBatchFiles([]);
                  setIsPhotoModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--iris)] text-white text-xs font-extrabold shadow-md hover:bg-[var(--iris-dark)] transition-all cursor-pointer mt-2"
              >
                <UploadCloud className="w-4 h-4" /> Upload Photos Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentCategoryPhotos.map((photo) => {
                const isSelected = selectedImageIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => isSelectionMode && toggleSelectPhoto(photo.id)}
                    className={`group relative bg-white rounded-2xl border overflow-hidden aspect-square transition-all duration-300 ${
                      isSelectionMode ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "ring-4 ring-[var(--iris)] border-[var(--iris)] scale-98 shadow-md"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || "Gallery photo"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Selection Mode Checkbox Indicator */}
                    {isSelectionMode && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-md transition-colors ${
                            isSelected ? "bg-[var(--iris)] text-white" : "bg-white/80 backdrop-blur-xs text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Default Actions & Caption Hover Overlay */}
                    {!isSelectionMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-md"
                            title="Delete Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {photo.caption && (
                          <p className="text-white text-xs font-semibold line-clamp-2 leading-snug drop-shadow-xs">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Multi-Photo Upload Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[var(--line)] max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--iris)] bg-[var(--iris)]/10 px-3 py-1 rounded-full border border-[var(--iris)]/20">
                Category: {selectedCategory}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Add Photos to "{selectedCategory}"
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Select multiple image files at once to upload directly into this category.
              </p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[var(--iris)] bg-slate-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <UploadCloud className="w-10 h-10 text-[var(--iris)] group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-sm text-slate-800">Click to Select Photos</span>
                <span className="text-xs text-slate-400 font-medium">Supports multiple PNG, JPG, WEBP images</span>
              </button>

              {/* Batch files preview list */}
              {batchFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700">{batchFiles.length} Photo(s) Selected:</p>
                    <button
                      type="button"
                      onClick={() => setBatchFiles([])}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {batchFiles.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <img src={item.previewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) => {
                            const text = e.target.value;
                            setBatchFiles((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, caption: text } : i))
                            );
                          }}
                          placeholder="Photo caption (optional)..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[var(--iris)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFileFromBatch(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatchPhotos}
                disabled={isUploadingBatch || batchFiles.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[var(--iris)] hover:bg-[var(--iris-dark)] text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingBatch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading ({uploadProgress.current}/{uploadProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload {batchFiles.length} Photo(s)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRenameCategory} className="bg-white rounded-3xl border border-[var(--line)] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Rename Category</h3>
            <input
              type="text"
              value={editingCategory.newName}
              onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-[var(--iris)] focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRenaming || !editingCategory.newName.trim()}
                className="px-5 py-2 rounded-xl bg-[var(--iris)] text-white text-xs font-extrabold hover:bg-[var(--iris-dark)] disabled:opacity-50 cursor-pointer"
              >
                {isRenaming ? "Saving..." : "Save Rename"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
