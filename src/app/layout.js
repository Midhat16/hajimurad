import "./globals.css";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";
import { Merriweather, Inter } from "next/font/google";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Haji Murad Eye Hospital | Advanced LASIK & Cataract Center",
  description: "Haji Murad Eye Hospital combines pioneering diagnostic technology with internationally acclaimed ophthalmic surgeons. Restoring and protecting your sight is our vision.",
  keywords: "Eye Hospital, LASIK, Cataract Surgery, Retina Treatment, Glaucoma Care, Eye Care Clinic, Ophthalmic Surgeons",
  robots: "index, follow",
  icons: {
    icon: "/images/favicon-logo.jpg",
    shortcut: "/images/favicon-logo.jpg",
    apple: "/images/favicon-logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-medical-light text-slate-800">
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
