import { X, Instagram, Linkedin } from "lucide-react";

const team = [
  {
    name: "Ikta Sollork",
    role: "Founder / CEO",
    image: "/team1.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    name: "Gwen Chase",
    role: "Marketing",
    image: "/team2.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    name: "James Bond",
    role: "Designer",
    image: "/team3.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    name: "Jenny Will",
    role: "SEO / Others",
    image: "/team4.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    name: "Jan Wink",
    role: "Web Developer",
    image: "/team5.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    name: "Lilli Math",
    role: "Designer",
    image: "/team6.jpg",
    socials: {
      x: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
];

export default function Team() {
  return (
    <section className="px-2 md:px-0 py-12 bg-gradient-to-b from-yellow-100 to-amber-100 min-h-[100vh] flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-900 text-white px-5 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="text-lg">👥</span> OUR AMAZING TEAM
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-[#6d1a2c] mb-2">
            Get to Know{" "}
            <span className="italic font-serif text-amber-900">Us</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <div
              key={i}
              className="bg-[#18181b] rounded-3xl flex flex-col sm:flex-row items-center justify-between p-6 gap-6 shadow-xl transition-transform hover:scale-[1.03] min-h-[220px]"
            >
              <div className="flex-1 flex flex-col justify-between h-full w-full">
                <div>
                  <h3 className="text-white text-lg md:text-xl font-semibold mb-1">
                    {member.name}
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base mb-4">
                    {member.role}
                  </p>
                </div>
                <div className="flex gap-3 mt-auto">
                  <a
                    href={member.socials.x}
                    className="border border-[#232326] rounded-xl p-2 hover:bg-[#232326] transition"
                    aria-label="X"
                  >
                    <X className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={member.socials.instagram}
                    className="border border-[#232326] rounded-xl p-2 hover:bg-[#232326] transition"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={member.socials.linkedin}
                    className="border border-[#232326] rounded-xl p-2 hover:bg-[#232326] transition"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
              <div className="flex-shrink-0">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-28 h-28 object-cover rounded-2xl bg-gray-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}