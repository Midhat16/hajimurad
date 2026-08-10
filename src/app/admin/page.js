"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--fog)] flex flex-col justify-center items-center">
      <div className="w-12 h-12 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-[#2B1F1A] uppercase tracking-widest">
        Redirecting to Admin Portal...
      </p>
    </div>
  );
}
