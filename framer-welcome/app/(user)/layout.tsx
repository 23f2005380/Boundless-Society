import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/Header.jsx";
import LenisProvider from "@/components/LenisProvider";

export const metadata: Metadata = {
  title: "Boundless Travel Society",
  description: "IITM based society to make travelling jhakkas !",
  keywords: ["boundless", "iitm boundless", "travel society", "college travel club", "student trips", "adventure travel"],
  openGraph: {
    title: "Boundless Travel Society",
    description: "IITM based society to make travelling jhakkas !",
    url: "https://boundless.iitmbs.org",
    siteName: "Boundless Travel Society",
    images: ["/Logo Bound.png"],
    type: "website",
  },
  alternates: {
    canonical: "https://boundless.iitmbs.org/city-meetups"
  }
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // We remove <html> and <body> here because they are already in app/layout.tsx
    <LenisProvider>
      <Header />
      <div className="pt-20">{children}</div>
    </LenisProvider>
  );
}