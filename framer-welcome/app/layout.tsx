import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header.jsx";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Boundless Travel Society",
  description: "IITM based society to make traveling jhakas",
  generator: "",
};
import LenisProvider from "@/components/LenisProvider";
import WelcomeBanner from "@/components/WelcomeBanner";

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
      <LenisProvider>
        <body style={{ background: "#fffbea" }}>
          <WelcomeBanner />
          <Header />
          <div className="pt-20">{children}</div>
        </body>
      </LenisProvider>
    </html>
  );
}
