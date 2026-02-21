import { WifiOff } from "lucide-react";

interface NoSessionSelectedProps {
  onManageDevices: () => void;
}

export const NoSessionSelected:React.FC<NoSessionSelectedProps> = ({ onManageDevices }) => (
  <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-[#111B21]">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-[#00a884] opacity-10 blur-3xl rounded-full"></div>
      <WifiOff size={80} className="relative text-[#8696A0] opacity-20" />
    </div>
    <h3 className="text-[#E9EDEF] text-xl font-bold mb-2">Perangkat Belum Terhubung</h3>
    <p className="text-[#8696A0] text-sm max-w-[250px] leading-relaxed">
      Pilih salah satu session di menu <b>Perangkat</b> atau hubungkan WhatsApp baru untuk mulai melihat chat.
    </p>
  </div>
);