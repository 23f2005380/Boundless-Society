import type { Metadata } from "next";
import "./globals.css";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Boundless Travel Society",
  description: "IITM based society to make traveling jhakas",
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

      <body style={{ background: "#fffbea" }}>{children}</body>
    </html>
  );
}
