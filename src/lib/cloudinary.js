// Utility function for direct Cloudinary file and Base64 Data URL uploads

export async function uploadMediaToCloudinary(fileOrDataUrl, resourceType = "auto") {
  if (!fileOrDataUrl) return "";

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "cakv1rwq";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "haji_murad assets";

  // Handle native File object
  if (fileOrDataUrl instanceof File) {
    const formData = new FormData();
    formData.append("file", fileOrDataUrl);
    formData.append("upload_preset", uploadPreset);

    const typePath = resourceType === "video" ? "video" : resourceType === "image" ? "image" : "auto";
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${typePath}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const autoRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      if (!autoRes.ok) {
        const errData = await autoRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "Cloudinary file upload failed");
      }
      const autoData = await autoRes.json();
      return autoData.secure_url || autoData.url;
    }

    const data = await res.json();
    return data.secure_url || data.url;
  }

  // If already an HTTP/HTTPS URL
  if (typeof fileOrDataUrl === "string") {
    const str = fileOrDataUrl.trim();
    if (str.startsWith("http://") || str.startsWith("https://")) {
      return str;
    }

    // If Base64 Data URL
    if (str.startsWith("data:")) {
      const isVideo = str.startsWith("data:video/") || resourceType === "video";
      const typePath = isVideo ? "video" : "image";

      const formData = new FormData();
      formData.append("file", str);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${typePath}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const autoRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        });
        if (!autoRes.ok) {
          const errData = await autoRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Cloudinary Base64 upload failed");
        }
        const autoData = await autoRes.json();
        return autoData.secure_url || autoData.url;
      }

      const data = await res.json();
      return data.secure_url || data.url;
    }

    return str;
  }

  return "";
}
