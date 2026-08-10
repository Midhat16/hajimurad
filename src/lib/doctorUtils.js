// Utility for consistent doctor ordering across public site & admin panel

export const PREFERRED_DOCTOR_ORDER = [
  "abdul rauf",
  "arslan shahid",
  "zafar iqbal",
  "sonia hameed",
  "palwasha",
  "rabia mustafa",
  "usman ali khan",
];

export function getDoctorOrderIndex(doctor) {
  if (!doctor) return 999;

  // 1. If explicit numeric order field exists (e.g. 1, 2, 3...)
  if (typeof doctor.order === "number" && !isNaN(doctor.order)) {
    return doctor.order;
  }

  // 2. Substring match against preferred standard 7 doctors list
  const nameLower = (doctor.name || "").toLowerCase();
  for (let i = 0; i < PREFERRED_DOCTOR_ORDER.length; i++) {
    if (nameLower.includes(PREFERRED_DOCTOR_ORDER[i])) {
      return i + 1; // 1 to 7
    }
  }

  // 3. Fallback for new future doctors added by admin without explicit order index
  return 1000;
}

export function sortDoctors(doctorsList) {
  if (!Array.isArray(doctorsList)) return [];

  return [...doctorsList].sort((a, b) => {
    const orderA = getDoctorOrderIndex(a);
    const orderB = getDoctorOrderIndex(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Secondary sort: By explicit createdAt or timestamp (oldest first -> sequence added)
    const getTime = (docItem) => {
      if (!docItem) return 0;
      if (docItem.createdAt?.seconds) return docItem.createdAt.seconds * 1000;
      if (typeof docItem.createdAt?.toMillis === "function") return docItem.createdAt.toMillis();
      if (typeof docItem.createdAt === "number") return docItem.createdAt;
      if (docItem.createdAt instanceof Date) return docItem.createdAt.getTime();
      return 0;
    };

    const timeA = getTime(a);
    const timeB = getTime(b);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Tertiary sort: Alphabetical by name or document ID fallback
    return (a.name || a.id || "").localeCompare(b.name || b.id || "");
  });
}
