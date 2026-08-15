import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { PDF_LOGO_BASE64, PDF_BANNER_BASE64 } from "../../lib/pdfAssets";

// Helper to resolve safe Base64 image data for @react-pdf/renderer
const getSafePdfImage = (imgSrc, fallbackBase64) => {
  if (!imgSrc || typeof imgSrc !== "string") return fallbackBase64;
  if (imgSrc.startsWith("data:image/") || imgSrc.startsWith("http://") || imgSrc.startsWith("https://")) {
    return imgSrc;
  }
  // Relative paths like "/images/logo.png" fail in client-side Blob workers, so fallback to pre-encoded Base64
  return fallbackBase64;
};

// Styles matching hospital theme (#C4232C Red Header & #1E1433 Dark Navy Accents)
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // Top Banner Wrapper on Page 1 (Full Bleed Edge-to-Edge Width: 0 to 595pt)
  headerWrapper: {
    width: "100%",
    marginBottom: 14,
  },
  // 1. Website Navbar Style Header Bar (Full Width)
  websiteHeaderBar: {
    backgroundColor: "#FBF9F4",
    paddingHorizontal: 25,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E1F9",
  },
  headerLeftBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogoCircle: {
    width: 44,
    height: 44,
    marginRight: 10,
    objectFit: "contain",
  },
  brandTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandNameDark: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2B1F1A",
  },
  brandNameRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C4232C",
    marginLeft: 4,
  },
  brandSubtextRed: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#C4232C",
    letterSpacing: 1.2,
    marginTop: 1.5,
  },

  // Right Side Contact Info Box inside Top Bar
  headerRightContact: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  contactItemText: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#4B5563",
    marginTop: 1.5,
  },
  contactItemHighlight: {
    color: "#C4232C",
    fontWeight: "bold",
  },
  contactWebLink: {
    color: "#1E1433",
    fontWeight: "bold",
    textDecoration: "underline",
  },

  // 2. Full Width Building Image Banner (100% Page Width - Edge to Edge, No Side Margins)
  fullWidthBuildingImageContainer: {
    width: "100%",
    height: 175,
    overflow: "hidden",
  },
  fullWidthBuildingImage: {
    width: "100%",
    height: 175,
  },
  redBannerLine: {
    height: 3.5,
    width: "100%",
    backgroundColor: "#C4232C",
  },

  // Continuation Header for Page 2+
  continuationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: "#C4232C",
  },
  continuationTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#C4232C",
    textTransform: "uppercase",
  },
  webLinkFooter: {
    color: "#1E1433",
    fontWeight: "bold",
    textDecoration: "underline",
  },

  // Main Container
  container: {
    paddingHorizontal: 35,
    paddingTop: 18,
  },

  // Title Row
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1E1433",
  },
  mainTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: "#1E1433",
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
  },

  // Details Grid Containers
  twoColumnGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  column: {
    width: "48.5%",
    backgroundColor: "#F8F7FF",
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
    borderColor: "#E5E1F9",
  },
  fullWidthColumn: {
    width: "100%",
    backgroundColor: "#F8F7FF",
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
    borderColor: "#E5E1F9",
    marginBottom: 12,
  },
  innerGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  innerGridCol: {
    width: "48.5%",
  },
  columnHeader: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1E1433",
    marginBottom: 8,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E1F9",
    paddingBottom: 4,
  },
  fieldGroup: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 7.5,
    color: "#6B7280",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  fieldValue: {
    fontSize: 9,
    color: "#111827",
    fontWeight: "bold",
    marginTop: 1,
  },
  statusPending: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#D97706",
    marginTop: 1,
  },

  // Selected Features / Treatments Section
  featuresBox: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#7E22CE",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  featureItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8B4FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    marginRight: 6,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6B21A8",
  },

  // Additional Notes Box
  notesBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 9,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.35,
  },

  // Pending Verification Notice Box
  pendingNoticeBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 6,
    padding: 9,
    marginBottom: 12,
  },
  pendingNoticeText: {
    fontSize: 8,
    color: "#B45309",
    lineHeight: 1.35,
    fontWeight: "bold",
  },

  // Patient Instructions Box
  instructionsBox: {
    backgroundColor: "#FFF5F5",
    borderLeftWidth: 4,
    borderLeftColor: "#C4232C",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#C4232C",
    marginBottom: 4,
  },
  instructionItem: {
    fontSize: 7.5,
    color: "#374151",
    marginBottom: 2,
    lineHeight: 1.3,
  },

  // Bottom Section: Policies & Query Contact
  bottomRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  policyBox: {
    width: "100%",
  },
  policyTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 3,
  },
  policyText: {
    fontSize: 7.5,
    color: "#4B5563",
    lineHeight: 1.35,
  },
  queryContact: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#C4232C",
    marginTop: 4,
  },

  // Footer Section
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 35,
    paddingBottom: 6,
  },
  footerText: {
    fontSize: 7.5,
    color: "#6B7280",
    fontWeight: "bold",
  },
  footerBottomBar: {
    height: 6,
    backgroundColor: "#C4232C",
  },
});

/**
 * AppointmentPDFDocument Component
 * Dynamic PDF Template generated via @react-pdf/renderer
 */
export default function AppointmentPDFDocument({
  patientName = "Valued Patient",
  appointmentId = "HM-2026-0001",
  appointmentFor = "",
  age = "",
  dob = "",
  gender = "",
  cnic = "",
  contact = "0324-1111692",
  email = "",
  address = "",
  guardianName = "",
  guardianRelation = "",
  guardianPhone = "",
  guardianCnic = "",
  service = "General Eye Consultation",
  selectedFeatures = [],
  doctor = "Assigned Medical Officer",
  date = "2026-08-10",
  time = "10:00 AM - 11:00 AM",
  branch = "Main OPD Complex, Haji Murad Eye Hospital Trust",
  notes = "",
  logoUrl = PDF_LOGO_BASE64,
  bannerBgUrl = PDF_BANNER_BASE64,
}) {
  // Safe Base64 Image Resolvers
  const resolvedLogoUrl = getSafePdfImage(logoUrl, PDF_LOGO_BASE64);
  const resolvedBannerBgUrl = getSafePdfImage(bannerBgUrl, PDF_BANNER_BASE64);

  // Normalize selectedFeatures if passed as comma-separated string
  let featuresList = [];
  if (Array.isArray(selectedFeatures)) {
    featuresList = selectedFeatures.filter(Boolean);
  } else if (typeof selectedFeatures === "string" && selectedFeatures.trim()) {
    featuresList = selectedFeatures.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const isSomeoneElse = String(appointmentFor).trim().toLowerCase() === "someone else";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Header Wrapper (Page 1) */}
        <View style={styles.headerWrapper}>
          {/* 1. Website Navbar Style Header Bar (Full Width) */}
          <View style={styles.websiteHeaderBar}>
            {/* Left Side: Circular Logo + Haji Murad EYE HOSPITAL TRUST Brand */}
            <View style={styles.headerLeftBrand}>
              <Image src={resolvedLogoUrl} style={styles.headerLogoCircle} />
              <View style={styles.brandTextContainer}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandNameDark}>Haji</Text>
                  <Text style={styles.brandNameRed}>Murad</Text>
                </View>
                <Text style={styles.brandSubtextRed}>EYE HOSPITAL TRUST</Text>
              </View>
            </View>

            {/* Right Side: Hospital Contact Details (Helpline, Email, Web) */}
            <View style={styles.headerRightContact}>
              <Text style={styles.contactItemText}>
                Query Helpline: <Text style={styles.contactItemHighlight}>0324-1111692</Text>
              </Text>
              <Text style={styles.contactItemText}>
                Email: <Text style={styles.contactItemHighlight}>info@hmeht.com</Text>
              </Text>
              <Text style={styles.contactItemText}>
                Web: <Text style={styles.contactWebLink}>https://hmeht.com/</Text>
              </Text>
            </View>
          </View>

          {/* 2. Full Page Width Hospital Building Cover Image Banner */}
          <View style={styles.fullWidthBuildingImageContainer}>
            <Image src={resolvedBannerBgUrl} style={styles.fullWidthBuildingImage} />
          </View>
          <View style={styles.redBannerLine} />
        </View>

        {/* Main Content Area */}
        <View style={styles.container}>
          {/* Title & Reference Badge */}
          <View style={styles.titleRow} wrap={false}>
            <Text style={styles.mainTitle}>Appointment Request Slip</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>REF: #{appointmentId}</Text>
            </View>
          </View>

          {/* Conditional Layout Rendering */}
          {isSomeoneElse ? (
            /* ================= 3-BLOCK LAYOUT (SOMEONE ELSE) ================= */
            <View>
              {/* Row 1: Patient Details & Guardian Details Side-by-Side */}
              <View style={styles.twoColumnGrid} wrap={false}>
                {/* Block 1: Patient Details */}
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>Patient Details</Text>
                  
                  {patientName ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Patient Full Name</Text>
                      <Text style={styles.fieldValue}>{patientName}</Text>
                    </View>
                  ) : null}

                  {age || gender ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Age / Gender</Text>
                      <Text style={styles.fieldValue}>
                        {[age ? `${age} Yrs` : null, gender].filter(Boolean).join(" | ")}
                      </Text>
                    </View>
                  ) : null}

                  {email ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Email Address</Text>
                      <Text style={styles.fieldValue}>{email}</Text>
                    </View>
                  ) : null}

                  {cnic ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>CNIC / B-Form ID</Text>
                      <Text style={styles.fieldValue}>{cnic}</Text>
                    </View>
                  ) : null}

                  {address ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Patient Address</Text>
                      <Text style={styles.fieldValue}>{address}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Block 2: Guardian / Booker Details */}
                <View style={styles.column}>
                  <Text style={styles.columnHeader}>Guardian / Booker Details</Text>

                  {guardianName ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Guardian Full Name</Text>
                      <Text style={styles.fieldValue}>{guardianName}</Text>
                    </View>
                  ) : null}

                  {guardianRelation ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Relationship to Patient</Text>
                      <Text style={styles.fieldValue}>{guardianRelation}</Text>
                    </View>
                  ) : null}

                  {guardianPhone || contact ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Contact Phone Number</Text>
                      <Text style={styles.fieldValue}>{guardianPhone || contact}</Text>
                    </View>
                  ) : null}

                  {guardianCnic ? (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Guardian CNIC</Text>
                      <Text style={styles.fieldValue}>{guardianCnic}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Row 2: Appointment & Consultation Details (Full Width Box) */}
              <View style={styles.fullWidthColumn} wrap={false}>
                <Text style={styles.columnHeader}>Appointment Details</Text>
                
                <View style={styles.innerGridRow}>
                  {/* Inner Left Column */}
                  <View style={styles.innerGridCol}>
                    {service ? (
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Treatment / Service</Text>
                        <Text style={styles.fieldValue}>{service}</Text>
                      </View>
                    ) : null}

                    {doctor ? (
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Attending Doctor / Specialist</Text>
                        <Text style={styles.fieldValue}>
                          {doctor === "not_sure" ? "Assigned Specialist (Front Desk Decision)" : doctor}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Inner Right Column */}
                  <View style={styles.innerGridCol}>
                    {date || time ? (
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Requested Date & Time</Text>
                        <Text style={styles.fieldValue}>{date} {time ? `@ ${time}` : ""}</Text>
                      </View>
                    ) : null}

                    {branch ? (
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Branch / Location</Text>
                        <Text style={styles.fieldValue}>{branch}</Text>
                      </View>
                    ) : null}

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Booking Status</Text>
                      <Text style={styles.statusPending}>PENDING VERIFICATION</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* ================= STANDARD 2-BLOCK LAYOUT (MYSELF / SELF) ================= */
            <View style={styles.twoColumnGrid} wrap={false}>
              {/* Column 1: Patient Information */}
              <View style={styles.column}>
                <Text style={styles.columnHeader}>Patient Details</Text>
                
                {patientName ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Patient Full Name</Text>
                    <Text style={styles.fieldValue}>{patientName}</Text>
                  </View>
                ) : null}

                {age || gender ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Age / Gender</Text>
                    <Text style={styles.fieldValue}>
                      {[age ? `${age} Yrs` : null, gender].filter(Boolean).join(" | ")}
                    </Text>
                  </View>
                ) : null}

                {contact ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Contact Phone Number</Text>
                    <Text style={styles.fieldValue}>{contact}</Text>
                  </View>
                ) : null}

                {email ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <Text style={styles.fieldValue}>{email}</Text>
                  </View>
                ) : null}

                {cnic ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CNIC / B-Form ID</Text>
                    <Text style={styles.fieldValue}>{cnic}</Text>
                  </View>
                ) : null}

                {address ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Patient Address</Text>
                    <Text style={styles.fieldValue}>{address}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Booking Status</Text>
                  <Text style={styles.statusPending}>PENDING VERIFICATION</Text>
                </View>
              </View>

              {/* Column 2: Appointment Information */}
              <View style={styles.column}>
                <Text style={styles.columnHeader}>Appointment Details</Text>

                {service ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Treatment / Service</Text>
                    <Text style={styles.fieldValue}>{service}</Text>
                  </View>
                ) : null}

                {doctor ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Attending Doctor / Specialist</Text>
                    <Text style={styles.fieldValue}>
                      {doctor === "not_sure" ? "Assigned Specialist (Front Desk Decision)" : doctor}
                    </Text>
                  </View>
                ) : null}

                {date || time ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Requested Date & Time</Text>
                    <Text style={styles.fieldValue}>{date} {time ? `@ ${time}` : ""}</Text>
                  </View>
                ) : null}

                {branch ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Branch / Location</Text>
                    <Text style={styles.fieldValue}>{branch}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Selected Features / Treatments Section */}
          {featuresList.length > 0 ? (
            <View style={styles.featuresBox} wrap={false}>
              <Text style={styles.featuresTitle}>Selected Procedures & Treatments</Text>
              <View style={styles.featuresGrid}>
                {featuresList.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Text style={styles.featureText}>✓ {feat}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Additional Notes Box */}
          {notes ? (
            <View style={styles.notesBox} wrap={false}>
              <Text style={styles.notesTitle}>Patient Notes / Symptoms</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          ) : null}

          {/* Pending Verification Notice */}
          <View style={styles.pendingNoticeBox} wrap={false}>
            <Text style={styles.pendingNoticeText}>
              NOTICE: Your appointment request has been received and is currently pending verification by our hospital coordinator. You will receive a final confirmation call / SMS once verified.
            </Text>
          </View>

          {/* Important Instructions Box */}
          <View style={styles.instructionsBox} wrap={false}>
            <Text style={styles.instructionsTitle}>Important Patient Guidelines & Prep Instructions</Text>
            <View wrap={false}>
              <Text style={styles.instructionItem}>1. Reporting Time: Please arrive at the hospital reception 15 minutes before your time slot.</Text>
              <Text style={styles.instructionItem}>2. Required Documents: Carry your original CNIC/B-Form and any previous eye test reports.</Text>
              <Text style={styles.instructionItem}>3. Dilation Notice: Dilation drops may cause temporary blurred vision for 2-3 hours. Bring an accompanying person if driving.</Text>
            </View>
          </View>

          {/* Bottom Policies & Query Contact Number */}
          <View style={styles.bottomRow} wrap={false}>
            <View style={styles.policyBox}>
              <Text style={styles.policyTitle}>Cancellation & Rescheduling Policy</Text>
              <Text style={styles.policyText}>
                If you need to reschedule or cancel your appointment, please notify us at least 4 hours in advance.
              </Text>
              <Text style={styles.queryContact}>For any queries or assistance, contact helpline: 0324-1111692</Text>
            </View>
          </View>
        </View>

        {/* Footer Bar */}
        <View style={styles.footer} fixed>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Thank you for choosing Haji Murad Eye Hospital Trust | <Text style={styles.webLinkFooter}>https://hmeht.com/</Text>
            </Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
          <View style={styles.footerBottomBar} />
        </View>
      </Page>
    </Document>
  );
}
