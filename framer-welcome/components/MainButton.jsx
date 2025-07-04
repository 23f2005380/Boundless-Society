import React from "react";

const MainButton = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-6 font-oswald font-bold py-2 rounded-2xl border-0 bg-[#ffe878] text-black text-[20px] tracking-wider 
                 shadow-[0_8px_0_0_rgb(59,0,27)] transition-all duration-300 ease-in-out 
                 hover:shadow-[0_3px_0_0_rgb(59,0,27)] active:bg-[#ffe878] active:shadow-none hover:translate-y-[4px] active:translate-y-[5px]"
    >
      {children}
    </button>
  );
};

export default MainButton;
