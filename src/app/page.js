import React from "react";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import UanHelplineBanner from "@/components/UanHelplineBanner";
import ServicesPreview from "@/components/ServicesPreview";
import MessagesPreview from "@/components/MessagesPreview";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <UanHelplineBanner />
      <ServicesPreview />
      <MessagesPreview />
      <Testimonials />
    </>
  );
}


