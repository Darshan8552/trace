import { Features } from "@/components/landing/features";
import { FileTypes } from "@/components/landing/file-types";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Privacy } from "@/components/landing/privacy";
import { Quote } from "@/components/landing/quote";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <FileTypes />
        <HowItWorks />
        <Features />
        <Privacy />
        <Quote />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
