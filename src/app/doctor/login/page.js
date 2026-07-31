"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useDoctorAuth } from "@/context/DoctorAuthContext";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorLoginPage() {
  const router = useRouter();
  const { isDoctorAuthorized, setDoctorSession } = useDoctorAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isDoctorAuthorized) {
      router.push("/doctor/dashboard");
    }
  }, [isDoctorAuthorized, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const inputEmailClean = email.trim().toLowerCase();
      const inputPasswordClean = password.trim();

      let matchedDoctorId = null;

      // 1. Query doctorCredentials collection
      try {
        const q = query(
          collection(db, "doctorCredentials"),
          where("email", "==", inputEmailClean),
          where("password", "==", inputPasswordClean)
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const matchedDoc = querySnap.docs[0];
          matchedDoctorId = matchedDoc.data().doctorId || matchedDoc.id;
        }
      } catch (credErr) {
        console.warn("doctorCredentials query notice:", credErr);
      }

      // Fallback query in doctors collection
      if (!matchedDoctorId) {
        try {
          const qDoc = query(
            collection(db, "doctors"),
            where("loginEmail", "==", inputEmailClean),
            where("loginPassword", "==", inputPasswordClean)
          );
          const docSnap = await getDocs(qDoc);
          if (!docSnap.empty) {
            matchedDoctorId = docSnap.docs[0].id;
          }
        } catch (docErr) {
          console.warn("doctors collection fallback query notice:", docErr);
        }
      }

      if (!matchedDoctorId) {
        // Match not found -> Return unauthorized error immediately, DO NOT call Firebase Auth!
        setError("Unauthorized — this login is for registered doctors only");
        setIsSubmitting(false);
        return;
      }

      // 2. Set Auth Persistence to browserLocalPersistence
      await setPersistence(auth, browserLocalPersistence);

      // 3. Try Firebase Auth sign in
      try {
        await signInWithEmailAndPassword(auth, inputEmailClean, inputPasswordClean);
        setDoctorSession(matchedDoctorId);
        router.push("/doctor/dashboard");
      } catch (authErr) {
        if (
          authErr.code === "auth/user-not-found" ||
          authErr.code === "auth/invalid-credential"
        ) {
          // First time login auto-bootstrap
          try {
            await createUserWithEmailAndPassword(auth, inputEmailClean, inputPasswordClean);
            setDoctorSession(matchedDoctorId);
            router.push("/doctor/dashboard");
          } catch (createErr) {
            if (createErr.code === "auth/email-already-in-use") {
              setError("Incorrect login credentials.");
            } else {
              setError(createErr.message || "Authentication failed.");
            }
          }
        } else {
          setError("Incorrect login credentials.");
        }
      }
    } catch (err) {
      console.error("Doctor Login error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D5C] via-[#124B6F] to-[#3E8E6E] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Soft background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-white/20 shadow-2xl relative z-10"
      >
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F0EC] text-[#3E8E6E] mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Stethoscope className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-[#3E8E6E] uppercase bg-[#E8F0EC] px-3 py-1 rounded-full border border-[#D5E5DD]">
            Ophthalmic Specialist Portal
          </span>
          <h1 className="text-2xl font-extrabold text-[#0B3D5C] mt-3 tracking-tight">
            Doctor Sign In
          </h1>
          <p className="text-xs font-semibold text-[#3F4B4A] mt-1">
            Haji Murad Trust Eye Hospital — Clinical Dashboard
          </p>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0B3D5C] uppercase tracking-wider block">
              Doctor Email
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

          {/* Password Field */}
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
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
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
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#0B3D5C] to-[#3E8E6E] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              "Sign In to Doctor Dashboard"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
