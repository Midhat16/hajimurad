import "./globals.css";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Haji Murad Eye Hospital | Advanced LASIK & Cataract Center",
  description: "Haji Murad Eye Hospital combines pioneering diagnostic technology with internationally acclaimed ophthalmic surgeons. Restoring and protecting your sight is our vision.",
  keywords: "Eye Hospital, LASIK, Cataract Surgery, Retina Treatment, Glaucoma Care, Eye Care Clinic, Ophthalmic Surgeons",
  robots: "index, follow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-medical-light text-slate-800">
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
