"use client";
import { useEffect, useRef, useState } from "react";
import { X as XIcon, Instagram, Linkedin } from "lucide-react";
import MemberAvatar from "./MemberAvatar";

function useFadeInOnScroll(deps: any[] = []) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    refs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, deps);
  return refs;
}

export default function CouncilSection() {
  const [termTitle, setTermTitle] = useState("");
  const [council, setCouncil] = useState<any[]>([]);
  const [deptHeads, setDeptHeads] = useState<any[]>([]);

  const headingRefs = useFadeInOnScroll();
  const councilRefs = useFadeInOnScroll([council]);
  const deptGroupRefs = useFadeInOnScroll([deptHeads]);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch("/api/team-members");
        if (res.ok) {
          const data = await res.json();
          const list = data.members || [];
          
          // Get all unique terms for council and dept heads
          const terms = Array.from(
            new Set(
              list
                .filter((m: any) => (m.type === "council" || m.type === "dept_head") && m.term)
                .map((m: any) => m.term)
            )
          ) as string[];

          if (terms.length > 1) {
            // Sort terms descending (latest first)
            terms.sort((a, b) => b.localeCompare(a));
            // Second highest term is the previous term
            const oldTerm = terms[1];

            const prevCouncil = list.filter((m: any) => m.type === "council" && m.term === oldTerm);
            const prevDept = list.filter((m: any) => m.type === "dept_head" && m.term === oldTerm);

            setTermTitle(`COUNCIL (${oldTerm})`);
            setCouncil(prevCouncil);
            setDeptHeads(prevDept);
          }
        }
      } catch (error) {
        console.error("Error fetching old council:", error);
      }
    }
    fetchTeam();
  }, []);

  return (
    <section className="relative py-8 bg-[#FFF9ED] overflow-hidden">
      <div className="relative z-10">
        <h2
          ref={(el) => {
            headingRefs.current[0] = el;
          }}
          className="text-center mb-12 fade-in text-5xl"
          style={{
            fontFamily: "'Oswald', Arial, sans-serif",
            fontWeight: 900,
            fontStretch: "condensed",
            letterSpacing: "0.04em",
            color: "#6d1a2c",
          }}
        >
          {termTitle}
        </h2>
        
        {council.length === 0 ? (
          <p className="text-center text-muted-foreground">No council members found for this term.</p>
        ) : (
          <div className="flex flex-row flex-wrap justify-center gap-x-14 gap-y-5">
            {council.map((member: any, i) => (
              <div
                key={i}
                ref={(el) => {
                  councilRefs.current[i] = el;
                }}
                className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
              >
                <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                  <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                  <p className="text-lg text-gray-300 mb-2">{member.role}</p>
                </div>
                <MemberAvatar
                  src={member.image || member.src || ""}
                  alt={member.name}
                  containerClassName="w-32 h-32 ml-4"
                  className="rounded-2xl shadow"
                />
              </div>
            ))}
          </div>
        )}

        <h2
          ref={(el) => {
            deptGroupRefs.current[0] = el;
          }}
          className="text-center mt-16 mb-12 fade-in"
          style={{
            fontFamily: "'Oswald', Arial, sans-serif",
            fontWeight: 900,
            fontStretch: "condensed",
            fontSize: "2.8rem",
            letterSpacing: "0.04em",
            color: "#6d1a2c",
          }}
        >
          DEPARTMENT HEADS
        </h2>
        
        {deptHeads.length === 0 ? (
          <p className="text-center text-muted-foreground">No department heads found for this term.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-0 gap-y-12 justify-items-center">
            {deptHeads.map((member: any, i) => (
              <div
                key={i}
                ref={(el) => {
                  deptGroupRefs.current[i + 1] = el;
                }}
                className="bg-black text-white hover:scale-110 transition-transform cursor-pointer rounded-3xl w-96 h-48 flex items-center px-6 py-4 mb-2 shadow-2xl border border-purple-200"
              >
                <div className="flex-1 flex flex-col justify-center items-start h-full py-1">
                  <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                  <p className="text-lg text-gray-300 mb-2">{member.role}</p>
                </div>
                <MemberAvatar
                  src={member.image || member.src || ""}
                  alt={member.name}
                  containerClassName="w-32 h-32 ml-4"
                  className="rounded-2xl shadow"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
