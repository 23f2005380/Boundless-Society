import type { Metadata } from "next";
import Head from "next/head";
import "@/app/globals.css";
import LenisProvider from "@/components/LenisProvider";

export const metadata: Metadata = {
  title: "Boundless Admin Page",
  description: "IITM Access page for Boundless Travel Society",
  generator: "",
};

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
          <div className="">{children}</div>
        </body>
      </LenisProvider>
    </html>
  );
}
