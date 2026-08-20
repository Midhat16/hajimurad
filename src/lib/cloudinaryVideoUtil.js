/**
 * Utility for Cloudinary Video & Media Optimization
 * Haji Murad Eye Hospital Trust
 */

/**
 * Inserts q_auto (automatic compression quality) and f_auto (automatic format delivery)
 * into Cloudinary Video URLs to minimize bandwidth and eliminate lag.
 * @param {string} url - Original video URL
 * @returns {string} - Optimized video URL
 */
export function getOptimizedCloudinaryVideoUrl(url) {
  if (!url || typeof url !== "string") return url || "";
  const cleanUrl = url.trim();
  if (!cleanUrl.includes("cloudinary.com") || !cleanUrl.includes("/upload/")) {
    return cleanUrl;
  }
  // Avoid duplicating transformation flags if already present
  if (cleanUrl.includes("/q_auto") || cleanUrl.includes("/f_auto")) {
    return cleanUrl;
  }
  return cleanUrl.replace("/upload/", "/upload/q_auto,f_auto/");
}

/**
 * Generates an automatic lightweight thumbnail / poster image URL (first frame: so_0)
 * from a Cloudinary Video URL.
 * @param {string} url - Original video URL
 * @returns {string|null} - Poster image URL
 */
export function getCloudinaryVideoPosterUrl(url) {
  if (!url || typeof url !== "string") return null;
  const cleanUrl = url.trim();
  if (!cleanUrl.includes("cloudinary.com") || !cleanUrl.includes("/upload/")) {
    return null;
  }

  let posterUrl = cleanUrl.replace("/upload/", "/upload/so_0,q_auto,f_auto/");
  // Replace video extension with .jpg for image poster rendering
  posterUrl = posterUrl.replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");
  return posterUrl;
}

/**
 * Checks if a string URL is a direct video file (MP4, WebM, Cloudinary video, or base64 data URI)
 * @param {string} url 
 * @returns {boolean}
 */
export function isDirectVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const str = url.trim().toLowerCase();
  return (
    str.includes("res.cloudinary.com") ||
    str.includes(".mp4") ||
    str.includes(".webm") ||
    str.includes(".mov") ||
    str.includes(".m4v") ||
    str.startsWith("data:video/")
  );
}

/**
 * Extracts official YouTube video thumbnail URL (hqdefault) from YouTube video link
 * @param {string} url 
 * @returns {string|null}
 */
export function getYoutubeThumbnailUrl(url) {
  if (!url || typeof url !== "string") return null;
  const str = url.trim();

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);

  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }

  return null;
}

/**
 * Extracts and formats YouTube Embed URL from any standard YouTube URL
 * @param {string} url 
 * @returns {string|null}
 */
export function getYoutubeEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const str = url.trim();
  
  if (str.includes("youtube.com/embed/")) {
    return str;
  }

  // Handle standard youtube.com/watch?v=ID or youtu.be/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = str.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }

  return null;
}
