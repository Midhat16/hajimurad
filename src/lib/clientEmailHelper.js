/**
 * Pure client-side helper to trigger email notifications via Next.js API route.
 * Safe to import in React Client Components ('use client') without bringing Node.js modules (fs, net, dns) into the browser bundle.
 */
export async function triggerEmailApi(payload) {
  try {
    if (typeof window === "undefined") return { success: false };
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("[triggerEmailApi] Email API response:", data);
    return data;
  } catch (err) {
    console.warn("[triggerEmailApi] Email API trigger notice (non-blocking):", err);
    return { success: false, error: err.message };
  }
}
