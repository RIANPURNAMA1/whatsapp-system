import React from "react";

interface NavButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}

const NavButton = ({ icon, active, onClick, title }: NavButtonProps) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all
      ${active ? "bg-[#374248] text-[#00a884]" : "text-[#8696A0] hover:bg-[#374248] hover:text-[#E9EDEF]"}
    `}
  >
    {icon}
    <div
      className={`absolute left-0 w-1 h-5 bg-[#00a884] rounded-r-full transition-transform ${
        active ? "scale-100" : "scale-0"
      }`}
    />
  </button>
);

export default NavButton;