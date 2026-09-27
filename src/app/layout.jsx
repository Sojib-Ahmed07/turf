// src/app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/home/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TurfZone — Book Football Turfs Online",
  description: "Find and book the best football turfs near you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-ink-900 antialiased`}>
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}