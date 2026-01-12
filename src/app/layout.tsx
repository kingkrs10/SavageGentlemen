import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Savage Gentlemen",
  description: "Events, products, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* Header handles its own user context if not passed props */}
            {/* @ts-ignore - Dynamic import issue with Next.js 13+ sometimes, but safe here */}
            <Header />
            <main className="flex-grow pb-16 md:pb-0">
              {children}
            </main>
            <BottomNavigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
