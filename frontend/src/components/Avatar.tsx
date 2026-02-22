import React, { useState, useEffect } from 'react';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { Users } from 'lucide-react';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isGroup?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  isGroup = false,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeClass = sizeMap[size];
  const bgColor = getAvatarColor(name || 'default');
  const initials = getInitials(name || '?');

  // Reset status error jika imageUrl berubah (misal ganti chat)
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  // Jika ada URL gambar DAN tidak sedang error, tampilkan IMG
  if (imageUrl && !hasError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-[#202C33] ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover animate-in fade-in duration-300"
          onError={() => setHasError(true)} // Jika error, switch ke mode inisial
        />
      </div>
    );
  }

  // Fallback: Tampilkan Inisial atau Icon Group
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white select-none shadow-sm ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {isGroup ? (
        <Users className="w-1/2 h-1/2 text-white opacity-90" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;