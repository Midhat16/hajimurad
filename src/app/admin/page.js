"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center">
      <div className="w-12 h-12 border-4 border-[#3E8E6E] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-[#0B3D5C] uppercase tracking-widest">
        Redirecting to Admin Portal...
      </p>
    </div>
  );
}
