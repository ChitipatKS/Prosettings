import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prosettings | Pro Player Settings & Gear Database",
  description: "Find mouse sensitivity, DPI, resolution, and PC specs of top professional players in VALORANT and CS2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#FAFAFA] selection:bg-[#F59E0B]/30 selection:text-white font-sans">
        {/* Ambient background decoration */}
        <div className="fixed inset-0 z-[-2] bg-[#0A0A0F]">
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>
          {/* Ambient light orbs */}
          <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[600px] h-[400px] rounded-full bg-[#F59E0B] opacity-[0.03] blur-[120px] pointer-events-none"></div>
        </div>
        
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
