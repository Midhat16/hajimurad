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
import { useHospitalProfile } from "@/lib/useHospitalProfile";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorLoginPage() {
  const router = useRouter();
  const { isDoctorAuthorized, setDoctorSession } = useDoctorAuth();
  const { profile } = useHospitalProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isDoctorAuthorized) {
      router.push("/doctor/dashboard");
    }
  }, [mounted, isDoctorAuthorized, router]);

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
      let doctorData = null;

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
          doctorData = matchedDoc.data();
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
            doctorData = docSnap.docs[0].data();
          }
        } catch (docErr) {
          console.warn("doctors collection fallback query notice:", docErr);
        }
      }

      if (!matchedDoctorId) {
        setError("Unauthorized — this login is for registered doctors only");
        setIsSubmitting(false);
        return;
      }

      // Ensure persistent login
      await setPersistence(auth, browserLocalPersistence);

      // 2. Attempt login with Firebase Auth
      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, inputEmailClean, inputPasswordClean);
      } catch (authErr) {
        // Self-heal: If doctor account does not exist in Firebase Auth yet, auto-create it
        if (
          authErr.code === "auth/user-not-found" ||
          authErr.code === "auth/invalid-credential"
        ) {
          try {
            userCred = await createUserWithEmailAndPassword(
              auth,
              inputEmailClean,
              inputPasswordClean
            );
          } catch (createErr) {
            if (createErr.code === "auth/email-already-in-use") {
              setError("Incorrect login credentials.");
            } else {
              setError(createErr.message || "Authentication failed.");
            }
            setIsSubmitting(false);
            return;
          }
        } else {
          setError("Incorrect login credentials.");
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Save Doctor Session in Context
      setDoctorSession(matchedDoctorId, {
        id: matchedDoctorId,
        ...doctorData,
        uid: userCred?.user?.uid || "",
      });

      router.push("/doctor/dashboard");
    } catch (err) {
      console.error("Doctor Login Error:", err);
      setError(err.message || "Failed to authenticate doctor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  if (isDoctorAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--fog)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--iris)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#2B1F1A]">Redirecting to Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-slate-100/80 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-100/80 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xl relative z-10"
      >
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--fog)] text-[var(--iris)] mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Stethoscope className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-[var(--iris)] uppercase bg-[var(--fog)] px-3 py-1 rounded-full border border-[var(--line)]">
            Ophthalmic Specialist Portal
          </span>
          <h1 className="text-2xl font-extrabold text-[#2B1F1A] mt-3 tracking-tight">
            Doctor Sign In
          </h1>
          <p className="text-xs font-semibold text-[var(--slate)] mt-1">
            {profile.hospitalName} — Doctor Dashboard
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
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-12 pr-4 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2B1F1A] uppercase tracking-wider block">
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
                className="w-full bg-[var(--fog)] border border-[var(--line)] focus:border-[var(--iris)] focus:ring-[var(--iris)]/20 rounded-xl pl-12 pr-12 py-3 text-sm text-[#2B1F1A] font-semibold focus:outline-none focus:ring-4 transition-all"
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
            className="w-full bg-[#1E1433] hover:bg-[#2A1C47] text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Doctor Credentials...
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
