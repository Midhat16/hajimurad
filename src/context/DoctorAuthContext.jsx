"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const DoctorAuthContext = createContext({
  doctorUser: null,
  doctorProfile: null,
  doctorId: null,
  loading: true,
  isDoctorAuthorized: false,
  setDoctorSession: (id) => {},
  logoutDoctor: async () => {},
});

export function DoctorAuthProvider({ children }) {
  const [doctorUser, setDoctorUser] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize doctorId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("activeDoctorId");
      if (savedId) {
        setDoctorId(savedId);
      }
    }
  }, []);

  // Listen to Firebase Auth and fetch Doctor Profile
  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setDoctorUser(currentUser);

      const activeId = doctorId || (typeof window !== "undefined" ? localStorage.getItem("activeDoctorId") : null);

      if (currentUser && activeId) {
        try {
          unsubProfile = onSnapshot(
            doc(db, "doctors", activeId),
            (docSnap) => {
              if (docSnap.exists()) {
                setDoctorProfile({ id: docSnap.id, ...docSnap.data() });
              } else {
                setDoctorProfile(null);
              }
              setLoading(false);
            },
            (err) => {
              console.warn("Doctor profile subscription warning:", err);
              setLoading(false);
            }
          );
        } catch (err) {
          console.warn("Error setting up doctor profile listener:", err);
          setLoading(false);
        }
      } else {
        setDoctorProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [doctorId]);

  const setDoctorSession = (id) => {
    setDoctorId(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("activeDoctorId", id);
      } else {
        localStorage.removeItem("activeDoctorId");
      }
    }
  };

  const logoutDoctor = async () => {
    await firebaseSignOut(auth);
    setDoctorUser(null);
    setDoctorId(null);
    setDoctorProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeDoctorId");
    }
  };

  const isDoctorAuthorized = !!doctorUser && !!doctorId;

  return (
    <DoctorAuthContext.Provider
      value={{
        doctorUser,
        doctorProfile,
        doctorId,
        loading,
        isDoctorAuthorized,
        setDoctorSession,
        logoutDoctor,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  );
}

export function useDoctorAuth() {
  return useContext(DoctorAuthContext);
}
