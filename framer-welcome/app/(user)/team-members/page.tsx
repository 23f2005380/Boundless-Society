import "./animations.css";
import Header from "@/components/Header";
import CouncilSection from "@/components/CouncilSection";
import AmazingTeam from "@/components/AmazingTeam";
import Footer from "@/components/Footer";
import New from "@/components/New"
export default function TeamMembersPage() {
  return (
    <div className="min-h-screen bg-[#FFF9ED]">
      
      <main className="pb-0">
        <div className="pt-8 pb-2">
          <h2 className="text-center text-4xl md:text-4xl font-black mb-2 tracking-wide">
            Get to Know <span className="italic font-serif text-[#6d1a2c]">Us</span>
          </h2>
        </div>
        <New />
      
         <CouncilSection />
        
        <div>
          {/* <AmazingTeam/> */}
        </div>
      </main>
      
    </div>
  );
} 