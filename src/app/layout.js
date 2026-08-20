import "./globals.css";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";
import { Merriweather, Inter } from "next/font/google";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hmeht.com"),
  title: "Haji Murad Eye Hospital Trust | Best Eye Hospital in Gujranwala",
  description: "Haji Murad Eye Hospital is the leading eye hospital in Gujranwala offering expert eye specialists, micro-incision cataract surgery, LASIK, retina, glaucoma care & 24/7 emergency eye treatment.",
  keywords: "eye hospital Gujranwala, best eye hospital Gujranwala, eye specialist Gujranwala, ophthalmologist Gujranwala, cataract surgery Gujranwala, LASIK Gujranwala, eye clinic Gujranwala",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/icon-192.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const hospitalSchema = {
  "@context": "https://schema.org",
  "@type": ["Hospital", "MedicalBusiness", "MedicalClinic"],
  "name": "Haji Murad Eye Hospital Trust Gujranwala",
  "alternateName": "Haji Murad Eye Trust Hospital",
  "url": "https://hajimuradeyehospital.org",
  "logo": "https://hajimuradeyehospital.org/logo.png",
  "image": "https://hajimuradeyehospital.org/favicon-logo.jpg",
  "telephone": "+92-300-1234567",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Main GT Road, Near Clock Tower",
    "addressLocality": "Gujranwala",
    "addressRegion": "Punjab",
    "postalCode": "52250",
    "addressCountry": "PK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 32.1617,
    "longitude": 74.1883
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    }
  ],
  "medicalSpecialty": [
    "Ophthalmology",
    "Optometry",
    "Pediatric Ophthalmology"
  ],
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "Micro-Incision Cataract Surgery (Phacoemulsification)"
    },
    {
      "@type": "MedicalProcedure",
      "name": "LASIK Vision Correction Surgery"
    },
    {
      "@type": "MedicalProcedure",
      "name": "Vitreoretinal Surgery & Laser Treatment"
    },
    {
      "@type": "MedicalProcedure",
      "name": "Glaucoma Diagnosis & Surgery"
    },
    {
      "@type": "MedicalProcedure",
      "name": "Corneal Transplant & Keratoconus Treatment"
    },
    {
      "@type": "MedicalProcedure",
      "name": "Pediatric Ophthalmology & Squint Surgery"
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${merriweather.variable} ${inter.variable} min-h-full antialiased max-w-full`}>
      <head>
        {/* Preconnect & DNS-Prefetch for External Media & API Origins */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Structured Data (JSON-LD Schema Markup) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-medical-light text-slate-800 max-w-full w-full relative">
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
