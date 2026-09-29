// src/app/page.jsx
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import LiveGrounds from "@/components/home/LiveGrounds";
import Footer from "@/components/home/Footer";
import { getPitches } from "@/app/actions/booking";

export default async function HomePage() {
  let pitches = [];
  try {
    pitches = await getPitches();
  } catch (err) {
    console.error("Failed to load pitches for home page:", err);
    pitches = [];
  }

  return (
    <>
      <main>
        <Hero />
        <LiveGrounds pitches={pitches} />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}