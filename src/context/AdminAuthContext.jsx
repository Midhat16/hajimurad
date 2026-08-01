"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AdminAuthContext = createContext({
  user: null,
  loading: true,
  authorizedEmail: null,
  isAuthorized: false,
  logout: async () => {},
  fetchAuthorizedEmail: async () => null,
});

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorizedEmail, setAuthorizedEmail] = useState(null);

  // Fetch authorized admin email from Firestore adminConfig/settings
  const getAuthorizedEmail = async () => {
    try {
      const snap = await getDoc(doc(db, "adminConfig", "settings"));
      if (snap.exists() && snap.data().email) {
        const email = snap.data().email;
        setAuthorizedEmail(email);
        return email;
      }
    } catch (err) {
      console.warn("Failed to fetch admin email config:", err);
    }
    return null;
  };

  useEffect(() => {
    let unsubConfig = () => {};

    // 2-second safety timeout to prevent infinite loading state if Firebase auth hangs or takes too long
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          unsubConfig = onSnapshot(
            doc(db, "adminConfig", "settings"),
            (docSnap) => {
              if (docSnap.exists() && docSnap.data().email) {
                setAuthorizedEmail(docSnap.data().email);
              }
            },
            (error) => {
              console.warn("adminConfig subscription notice:", error.message);
            }
          );
          await getAuthorizedEmail();
        } catch (err) {
          console.warn("Error fetching admin config:", err);
        }
      } else {
        setAuthorizedEmail(null);
      }

      clearTimeout(timer);
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      if (typeof unsubConfig === "function") unsubConfig();
      unsubAuth();
    };
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const isAuthorized =
    !!user &&
    (!authorizedEmail || user.email?.toLowerCase() === authorizedEmail.toLowerCase());

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        authorizedEmail,
        isAuthorized,
        logout,
        fetchAuthorizedEmail: getAuthorizedEmail,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
