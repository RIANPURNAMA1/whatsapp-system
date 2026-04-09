import React from "react";

interface NavButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
  size?: "sm" | "md";
  disabled?: boolean;
}

const NavButton = ({ icon, active, onClick, title, size = "md", disabled = false }: NavButtonProps) => {
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center ${sizeClasses} rounded-xl transition-all
        ${disabled 
          ? "opacity-40 cursor-not-allowed" 
          : active 
            ? "text-blue-600" 
            : "text-gray-400 hover:text-blue-500"
        }
      `}
    >
      {icon}
      {!disabled && (
        <div
          className={`absolute left-0 w-1 ${size === "sm" ? "h-4" : "h-5"} bg-blue-600 rounded-r-full transition-transform ${
            active ? "scale-100" : "scale-0"
          }`}
        />
      )}
    </button>
  );
};

export default NavButton;
