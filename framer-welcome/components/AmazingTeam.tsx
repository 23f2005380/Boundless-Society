"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import MemberAvatar from "./MemberAvatar";
import Section from "@/components/Section";
import Footer from "./Footer";
export default function AmazingTeam() {
  const [founders, setFounders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFounders() {
      try {
        const res = await fetch("/api/team-members");
        if (res.ok) {
          const data = await res.json();
          const dbFounders = (data.members || []).filter((m: any) => m.type === "founder");
          setFounders(dbFounders);
        }
      } catch (error) {
        console.error("Error fetching founders:", error);
      }
    }
    fetchFounders();
  }, []);

  return (
    <Section
      svgFill="#FFE878"
      sectionHeading="Founding Members"
      headingStyle="text-brown text-3xl"
    >
      <section className="relative px-6 mb-12 py-8 overflow-visible">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/team-members"
            className="block group"
            style={{ textDecoration: "none" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {founders.map((member: any, i) => (
                <div
                  key={i}
                  className="bg-black text-white hover:scale-105 transition-transform cursor-pointer rounded-lg w-full h-40 flex items-center px-4"
                >
                  {/* TEXT */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-base mb-1">
                      {member.name}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {member.role}
                    </p>
                  </div>

                  <MemberAvatar
                    src={member.image || member.src || ""}
                    alt={member.name}
                    containerClassName="w-28 h-28 ml-4 rounded-lg bg-zinc-800"
                  />
                </div>
              ))}
            </div>
          </Link>
        </div>

        <Footer />
      </section>
    </Section>
  );
}
