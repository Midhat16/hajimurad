import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Helper to wrap any async promise with a strict timeout in milliseconds
 */
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Upload timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Robust, fail-safe 3-tier image uploader:
 * 1. Cloudinary (Primary - Fast, unsigned upload preset)
 * 2. ImgBB (Secondary)
 * 3. Firebase Storage (Tertiary with strict timeout)
 * @param {File|Blob|string} fileOrDataUrl - Image file object or base64 data URL
 * @returns {Promise<string>} - Resolved secure remote URL
 */
export async function uploadImageFile(fileOrDataUrl) {
  if (!fileOrDataUrl) throw new Error("No image file provided.");

  let dataUrlToUse = fileOrDataUrl;

  // Convert File to Data URL if passed as File object
  if (typeof window !== "undefined" && fileOrDataUrl instanceof File) {
    dataUrlToUse = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  if (!dataUrlToUse || typeof dataUrlToUse !== "string") {
    throw new Error("Invalid image file format.");
  }

  // 1. Primary: Cloudinary Direct Unsigned Upload (Instant & Reliable)
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "cakv1rwq";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "haji_murad assets";
    const formData = new FormData();
    formData.append("file", dataUrlToUse);
    formData.append("upload_preset", uploadPreset);

    const cloudinaryFetch = fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (data.secure_url || data.url) {
        return data.secure_url || data.url;
      }
      throw new Error(data.error?.message || "Cloudinary upload failed");
    });

    const url = await withTimeout(cloudinaryFetch, 7000);
    if (url) return url;
  } catch (cErr) {
    console.warn("[uploadUtil] Cloudinary notice, trying ImgBB fallback:", cErr);
  }

  // 2. Secondary: ImgBB Upload
  try {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "6d700a708235b3658f287854659b43e8";
    const base64Clean = dataUrlToUse.includes(",") ? dataUrlToUse.split(",")[1] : dataUrlToUse;
    const formData = new FormData();
    formData.append("image", base64Clean);

    const imgbbFetch = fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (data.success && data.data && (data.data.url || data.data.display_url)) {
        return data.data.url || data.data.display_url;
      }
      throw new Error("ImgBB response missing URL");
    });

    const url = await withTimeout(imgbbFetch, 7000);
    if (url) return url;
  } catch (imgbbErr) {
    console.warn("[uploadUtil] ImgBB notice, trying Firebase Storage fallback:", imgbbErr);
  }

  // 3. Tertiary: Firebase Storage Upload (With 5s Timeout)
  try {
    const firebaseUpload = (async () => {
      const storagePath = `uploads/articles/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadString(storageRef, dataUrlToUse, "data_url");
      return await getDownloadURL(snapshot.ref);
    })();

    const url = await withTimeout(firebaseUpload, 5000);
    if (url) return url;
  } catch (fbErr) {
    console.warn("[uploadUtil] Firebase Storage notice:", fbErr);
  }

  // Fallback: If Data URL is within reasonable length or as last resort
  if (dataUrlToUse.startsWith("data:image/")) {
    return dataUrlToUse;
  }

  throw new Error("All upload providers failed. Please check your internet connection.");
}
