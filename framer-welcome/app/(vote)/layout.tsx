import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "HOD Election — Boundless Travel Society",
  description: "Cast your vote for the Head of Department elections.",
};

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-950 antialiased">
        {children}
      </body>
    </html>
  );
}
