import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Google Fonts (Inter) instead of local files
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Initialize the Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Boundless Society",
  description: "Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // FIXED: Added suppressHydrationWarning to ignore McAfee extension errors
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}