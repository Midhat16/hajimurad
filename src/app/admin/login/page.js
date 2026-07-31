"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthorized, fetchAuthorizedEmail } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in & authorized, redirect to dashboard immediately
  useEffect(() => {
    if (user && isAuthorized) {
      router.push("/admin/dashboard");
    }
  }, [user, isAuthorized, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const inputEmailClean = email.trim().toLowerCase();

    try {
      // 1. Authenticate with Firebase Auth first (or create user on first login)
      let userCredential = null;
      try {
        userCredential = await signInWithEmailAndPassword(auth, inputEmailClean, password);
      } catch (authErr) {
        console.log("SignIn error code:", authErr.code);
        if (
          authErr.code === "auth/user-not-found" ||
          authErr.code === "auth/invalid-credential"
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, inputEmailClean, password);
          } catch (createErr) {
            if (createErr.code === "auth/email-already-in-use") {
              setError("Incorrect password");
            } else {
              setError(createErr.message || "Authentication failed.");
            }
            setIsSubmitting(false);
            return;
          }
        } else if (authErr.code === "auth/wrong-password") {
          setError("Incorrect password");
          setIsSubmitting(false);
          return;
        } else {
          setError(authErr.message || "Authentication failed.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Now that user is authenticated, fetch authorized email from Firestore "adminConfig/settings"
      let authorizedEmail = null;
      try {
        const snap = await getDoc(doc(db, "adminConfig", "settings"));
        if (snap.exists()) {
          const data = snap.data();
          authorizedEmail = data.email || data.authorizedEmail || null;
        }
      } catch (err) {
        console.warn("Error fetching adminConfig settings after auth:", err);
      }

      if (!authorizedEmail) {
        authorizedEmail = await fetchAuthorizedEmail();
      }

      const authEmailClean = authorizedEmail ? authorizedEmail.trim().toLowerCase() : "";

      // 3. Check authorization: If adminConfig settings exists, verify email match
      if (authEmailClean && inputEmailClean !== authEmailClean) {
        await auth.signOut();
        setError(`Unauthorized access: ${inputEmailClean} is not configured as Authorized Admin.`);
        setIsSubmitting(false);
        return;
      }

      // Authorization success -> Navigate to dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Soft background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3E8E6E]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0B3D5C]/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#D5E5DD] shadow-xl relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0B3D5C] to-[#3E8E6E] flex items-center justify-center shadow-lg shadow-[#0B3D5C]/20 mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] tracking-tight">
            Haji Murad Eye Hospital
          </h1>
          <p className="text-xs font-bold text-[#3E8E6E] uppercase tracking-widest mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Portal Access
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-bold"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Authorized Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl pl-12 pr-4 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-[#F4F7F5] border border-[#D5E5DD] focus:border-[#3E8E6E] focus:ring-[#3E8E6E]/20 rounded-xl pl-12 pr-12 py-3 text-sm text-[#0B3D5C] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-[#0B3D5C] transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[#0B3D5C]/15 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              <>
                Sign In to Admin Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center border-t border-[#D5E5DD]/60 pt-4">
          <p className="text-[11px] text-slate-400 font-medium">
            Restricted System — Authorized Personnel Only
          </p>
        </div>
      </motion.div>
    </div>
  );
}
