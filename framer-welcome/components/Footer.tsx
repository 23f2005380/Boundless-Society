export default function Footer(){
    return (
         <footer className="px-0 md:px-0 pb-0 md:pb-0 w-full mt-20">
        <div className="w-full flex justify-center">
          <div className="w-[90%] min-h-[500px] bg-[#46001D] text-[#FFF9C7] shadow-2xl rounded-3xl border-0 flex flex-col p-6 md:p-10">
            <div className="flex flex-row justify-between items-start w-full mb-6">
              {/* Email Left */}
              <div className="flex flex-col items-start">
                <p className="text-xl md:text-2xl font-bold mb-2">Email</p>
                <p className="text-base md:text-lg font-semibold break-all">
                  boundless.club@study.iitm.ac.in
                </p>
              </div>
              {/* Socials Right */}
              <div className="flex flex-col items-end gap-2">
                <a
                  href="#"
                  className="text-xl md:text-2xl font-bold hover:underline"
                >
                  Youtube
                </a>
                <a
                  href="#"
                  className="text-xl md:text-2xl font-bold hover:underline"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-xl md:text-2xl font-bold hover:underline"
                >
                  Linkedin
                </a>
              </div>
            </div>
            <h1
              className="w-full font-black opacity-30 leading-none select-none tracking-normal bg-gradient-to-b from-[#FFFFFF] to-[#46001D] bg-clip-text text-transparent text-center mt-16"
              style={{
                fontSize: "clamp(2rem, 12vw, 10rem)",
                transform: "scaleY(2.4)",
              }}
            >
              BOUNDLESS
            </h1>
          </div>
        </div>
      </footer>
    )
}