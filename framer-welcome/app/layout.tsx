import type { Metadata } from "next";
import { Oswald, Pacifico, Nosifer } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });
const nosifer = Nosifer({ weight: "400", subsets: ["latin"], variable: "--font-nosifer" });

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="lenis">
      <body
        className={`${oswald.variable} ${pacifico.variable} ${nosifer.variable} antialiased`}
        style={{ background: "#fffbea" }}
      >
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}