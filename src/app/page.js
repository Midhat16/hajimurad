import React from "react";
import HomeGalleryStickyWrapper from "@/components/HomeGalleryStickyWrapper";
import UanHelplineBanner from "@/components/UanHelplineBanner";
import ServicesPreview from "@/components/ServicesPreview";
import MessagesPreview from "@/components/MessagesPreview";
import Testimonials from "@/components/Testimonials";

export const metadata = {
  title: "Haji Murad Eye Hospital Trust | Best Eye Hospital in Gujranwala",
  description:
    "Leading eye hospital in Gujranwala offering expert eye specialists, micro-incision cataract surgery (Phaco), LASIK vision correction, glaucoma care, & 24/7 emergency eye treatment.",
};

export default function Home() {
  return (
    <>
      {/* Deterministic JS-controlled Sticky Wrapper for Hero + WhyChooseUs */}
      <HomeGalleryStickyWrapper />

      {/* Sticky boundary releases naturally right before 24/7 Helpline Banner */}
      <UanHelplineBanner />
      <ServicesPreview />
      <MessagesPreview />
      <Testimonials />
    </>
  );
}
