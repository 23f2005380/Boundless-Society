import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/Header.jsx";
import Head from "next/head";

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


import LenisProvider from "@/components/LenisProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/Logo Bound.png" />
      </Head>
      <body style={{ background: "#fffbea" }}>
        <LenisProvider>
          <Header />
          <div className="pt-20">{children}</div>
        </LenisProvider>
      </body>
    </html>
  );
}
