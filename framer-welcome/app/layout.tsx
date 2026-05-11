import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://boundless.iitmbs.org"
  ),
  title: "Boundless Travel Society",
  description: "IITM based society to make travelling jhakkas !",
  icons: {
    icon: "/images/Gallery/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ background: "#fffbea" }}>{children}</body>
    </html>
  );
}
