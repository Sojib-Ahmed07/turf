// app/page.jsx
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedTurfs from "@/components/home/FeaturedTurfs";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedTurfs />
      </main>
      <Footer />
    </>
  );
}