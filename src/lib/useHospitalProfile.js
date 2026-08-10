"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DEFAULT_HOSPITAL_PROFILE = {
  hospitalName: "Haji Murad Eye Hospital Trust",
  logoUrl: "/images/logo.png",
};

export function formatBrandName(fullName) {
  const defaultRes = {
    mainFirst: "Haji",
    mainHighlight: "Murad",
    sub: "EYE HOSPITAL TRUST",
  };

  if (!fullName) return defaultRes;

  const cleanName = fullName.trim();
  if (!cleanName) return defaultRes;

  let mainPart = cleanName;
  let subPart = "EYE HOSPITAL TRUST";

  const suffixRegex = /^(.*?)\s+(eye\s+hospital\s+trust|trust\s+eye\s+hospital|eye\s+hospital|hospital\s+trust|hospital|clinic|center)$/i;
  const match = cleanName.match(suffixRegex);

  if (match) {
    mainPart = match[1].trim();
    subPart = match[2].trim().toUpperCase();
  } else {
    const words = cleanName.split(/\s+/);
    if (words.length > 2) {
      mainPart = words.slice(0, -2).join(" ");
      subPart = words.slice(-2).join(" ").toUpperCase();
    } else if (words.length === 2) {
      mainPart = words[0];
      subPart = words[1].toUpperCase();
    } else {
      mainPart = cleanName;
      subPart = "";
    }
  }

  // If mainPart ends with "Eye" (case-insensitive), move "Eye" to subPart
  if (/\beye$/i.test(mainPart)) {
    mainPart = mainPart.replace(/\beye$/i, "").trim();
    if (!subPart.toUpperCase().includes("EYE")) {
      subPart = "EYE " + subPart;
    }
  }

  const mainWords = mainPart.split(/\s+/).filter(Boolean);
  if (mainWords.length > 1) {
    const mainFirst = mainWords.slice(0, -1).join(" ");
    const mainHighlight = mainWords[mainWords.length - 1];
    return { mainFirst, mainHighlight, sub: subPart };
  }

  return { mainFirst: mainPart, mainHighlight: "", sub: subPart };
}

export function useHospitalProfile() {
  const [profile, setProfile] = useState(DEFAULT_HOSPITAL_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "siteContent", "profile"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            hospitalName: data.hospitalName || DEFAULT_HOSPITAL_PROFILE.hospitalName,
            logoUrl: data.logoUrl || DEFAULT_HOSPITAL_PROFILE.logoUrl,
          });
        } else {
          setProfile(DEFAULT_HOSPITAL_PROFILE);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to hospital profile:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { profile, loading };
}
