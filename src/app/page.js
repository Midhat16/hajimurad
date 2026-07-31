import React from "react";
import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Appointment from "@/components/Appointment";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <Appointment />
      <Testimonials />
    </>
  );
}
