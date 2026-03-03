import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "What's the Supplier?",
    template: "%s | What's the Supplier?",
  },
  description:
    "Discover verified industrial suppliers by country, industry and capability. Powered by ABR and intelligent domain analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen flex flex-col">

          {/* Navigation */}
          <nav className="bg-black text-white py-5">
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

              {/* Left spacer (keeps logo truly centered) */}
              <div className="w-1/3" />

              {/* Center Logo */}
              <div className="w-1/3 text-center font-bold text-xl tracking-wide">
                Supplier Gateway
              </div>

              {/* Right Navigation */}
              <div className="w-1/3 flex justify-end space-x-6 text-sm">
                <a href="/" className="hover:text-gray-300 transition">
                  Home
                </a>
                <a href="/search" className="hover:text-gray-300 transition">
                  Search
                </a>
                <a href="/suppliers" className="hover:text-gray-300 transition">
                  Suppliers
                </a>
              </div>

            </div>
          </nav>

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}