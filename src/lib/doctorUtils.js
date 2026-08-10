// Utility for consistent doctor ordering & feature-doctor intersection filtering across public site & admin panel

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

    // Secondary sort: By explicit createdAt or timestamp
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

const parseTimeToMinutes = (timeStr, defaultMinutes) => {
  if (!timeStr || typeof timeStr !== "string") return defaultMinutes;
  const str = timeStr.trim();
  const isPM = /pm/i.test(str);
  const isAM = /am/i.test(str);
  const cleanStr = str.replace(/(am|pm)/i, "").trim();
  const parts = cleanStr.split(":");
  let hours = parseInt(parts[0], 10);
  let minutes = parts[1] ? parseInt(parts[1], 10) : 0;
  if (isNaN(hours)) return defaultMinutes;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const formatMinutesToTime = (totalM) => {
  let h = Math.floor(totalM / 60) % 24;
  let m = totalM % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

/**
 * Calculates the INTERSECTION of doctors assigned to all selected features.
 * - When 1 feature is selected, returns doctors assigned to that feature.
 * - When MULTIPLE features are selected, returns ONLY doctors assigned to ALL selected features.
 */
export function getAvailableDoctorsForFeatures(
  selectedFeatures = [],
  featureDoctorMappings = [],
  doctorsList = [],
  serviceDoctorIds = []
) {
  if (!Array.isArray(doctorsList) || doctorsList.length === 0) return [];

  // If no features selected or no mappings exist, return fallback service doctors
  if (!selectedFeatures || selectedFeatures.length === 0 || !featureDoctorMappings || featureDoctorMappings.length === 0) {
    if (Array.isArray(serviceDoctorIds) && serviceDoctorIds.length > 0) {
      return sortDoctors(doctorsList.filter((doc) => serviceDoctorIds.includes(doc.id)));
    }
    return sortDoctors(doctorsList);
  }

  const doctorSetsPerFeature = [];

  for (const featName of selectedFeatures) {
    const mapping = featureDoctorMappings.find((m) => m.featureName === featName);
    if (mapping) {
      let docIdsForFeat = [];
      if (Array.isArray(mapping.assignedDoctorIds) && mapping.assignedDoctorIds.length > 0) {
        docIdsForFeat = mapping.assignedDoctorIds;
      } else if (Array.isArray(mapping.assignedDoctors) && mapping.assignedDoctors.length > 0) {
        docIdsForFeat = mapping.assignedDoctors.map((d) => d.doctorId);
      } else if (mapping.doctorOverrides) {
        docIdsForFeat = Object.keys(mapping.doctorOverrides);
      }

      doctorSetsPerFeature.push(new Set(docIdsForFeat));
    }
  }

  if (doctorSetsPerFeature.length === 0) {
    if (Array.isArray(serviceDoctorIds) && serviceDoctorIds.length > 0) {
      return sortDoctors(doctorsList.filter((doc) => serviceDoctorIds.includes(doc.id)));
    }
    return sortDoctors(doctorsList);
  }

  // Compute strict INTERSECTION across all selected features
  let intersectedDocIds = new Set(doctorSetsPerFeature[0]);

  for (let i = 1; i < doctorSetsPerFeature.length; i++) {
    const currentSet = doctorSetsPerFeature[i];
    const nextIntersection = new Set();
    for (const id of intersectedDocIds) {
      if (currentSet.has(id)) {
        nextIntersection.add(id);
      }
    }
    intersectedDocIds = nextIntersection;
  }

  const resultDoctors = doctorsList.filter((doc) => intersectedDocIds.has(doc.id));
  return sortDoctors(resultDoctors);
}

/**
 * Calculates the INTERSECTION of timing and operating days for a doctor across multiple selected features.
 */
export function getIntersectedDoctorTiming(docObj, serviceObj, selectedFeatures = []) {
  if (!docObj) return null;

  const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mappings = serviceObj?.featureDoctorMappings || [];

  const serviceStartM = parseTimeToMinutes(serviceObj?.serviceStartTime, 540); // 09:00 AM
  const serviceEndM = parseTimeToMinutes(serviceObj?.serviceEndTime, 1020);   // 05:00 PM

  const featureTimings = [];

  if (selectedFeatures && selectedFeatures.length > 0 && mappings.length > 0) {
    for (const featName of selectedFeatures) {
      const mapping = mappings.find((m) => m.featureName === featName);
      if (mapping) {
        let docTimingEntry = null;

        if (Array.isArray(mapping.assignedDoctors)) {
          const found = mapping.assignedDoctors.find((d) => d.doctorId === docObj.id);
          if (found && found.timing) {
            docTimingEntry = found.timing;
          }
        }

        if (!docTimingEntry && mapping.doctorOverrides && mapping.doctorOverrides[docObj.id]) {
          const ov = mapping.doctorOverrides[docObj.id];
          docTimingEntry = {
            start: ov.startTime,
            end: ov.endTime,
            days: ov.days,
            isOverride: !!ov.enabled,
          };
        }

        if (docTimingEntry) {
          const isOverride = docTimingEntry.isOverride;
          const startM = isOverride ? parseTimeToMinutes(docTimingEntry.start, serviceStartM) : serviceStartM;
          const endM = isOverride ? parseTimeToMinutes(docTimingEntry.end, serviceEndM) : serviceEndM;
          const days = (docTimingEntry.days && docTimingEntry.days.length > 0) ? docTimingEntry.days : defaultDays;

          featureTimings.push({ startM, endM, days, isOverride });
        }
      }
    }
  }

  if (featureTimings.length === 0) {
    const docProfileStartM = parseTimeToMinutes(docObj.workingHours?.start, serviceStartM);
    const docProfileEndM = parseTimeToMinutes(docObj.workingHours?.end, serviceEndM);
    const docProfileDays = (docObj.workingDays && docObj.workingDays.length > 0) ? docObj.workingDays : defaultDays;

    return {
      days: docProfileDays,
      startTime: formatMinutesToTime(docProfileStartM),
      endTime: formatMinutesToTime(docProfileEndM),
      startM: docProfileStartM,
      endM: docProfileEndM,
      hasOverlap: docProfileStartM < docProfileEndM,
    };
  }

  // 1. Operating Days Intersection
  let intersectedDaysSet = new Set(featureTimings[0].days);
  for (let i = 1; i < featureTimings.length; i++) {
    const nextSet = new Set();
    for (const day of intersectedDaysSet) {
      if (featureTimings[i].days.includes(day)) {
        nextSet.add(day);
      }
    }
    intersectedDaysSet = nextSet;
  }
  const intersectedDays = Array.from(intersectedDaysSet);

  // 2. Overlapping Time Window Intersection
  let maxStartM = Math.max(...featureTimings.map((t) => t.startM));
  let minEndM = Math.min(...featureTimings.map((t) => t.endM));

  const hasTimeOverlap = maxStartM < minEndM;
  const hasOverlap = hasTimeOverlap && intersectedDays.length > 0;

  return {
    days: intersectedDays,
    startTime: formatMinutesToTime(maxStartM),
    endTime: formatMinutesToTime(minEndM),
    startM: maxStartM,
    endM: minEndM,
    hasOverlap,
  };
}
