import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  subValue?: string;
  icon: any;
  color?: string; // Ini untuk warna Icon (misal: text-red-500)
  dark?: boolean;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ 
  dark, 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  color = "text-blue-400" 
}) => {
  // 1. Logika Warna Background & Border
  const bgClass = dark ? "bg-[#202C33]" : "bg-white";
  const borderClass = dark ? "border-[#313D45] hover:border-[#41525d]" : "border-[#E9EDEF] hover:border-[#00a884]/30";
  const titleColor = dark ? "text-[#8696A0]" : "text-[#667781]";
  const valueColor = dark ? "text-white" : "text-[#3B4A54]";
  const iconBg = dark ? "bg-[#0B141A]/50" : "bg-[#F0F2F5]";

  return (
    <div className={`${bgClass} ${borderClass} border p-5 rounded-md flex flex-col justify-between transition-all shadow-sm group`}>
      <div className="flex justify-between items-start">
        {/* Judul Stat */}
        <h3 className={`${titleColor} text-[10px] font-bold uppercase tracking-[0.1em]`}>
          {title}
        </h3>
        
        {/* Icon Wrapper */}
        <div className={`${color} p-2 rounded-lg ${iconBg} group-hover:scale-110 transition-transform`}>
          {Icon && <Icon size={18} />}
        </div>
      </div>

      <div className="mt-4">
        {/* Angka Utama */}
        <div className={`text-3xl font-black ${valueColor}`}>
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </div>
        
        {/* Sub-keterangan (jika ada) */}
        {subValue && (
          <div className={`text-[10px] ${titleColor} mt-1 font-medium italic`}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
});

export default StatCard;