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
      ${active 
        ? "bg-blue-100 text-blue-600" 
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
    `}
  >
    {icon}
    <div
      className={`absolute left-0 w-1 h-5 bg-blue-600 rounded-r-full transition-transform ${
        active ? "scale-100" : "scale-0"
      }`}
    />
  </button>
);

export default NavButton;