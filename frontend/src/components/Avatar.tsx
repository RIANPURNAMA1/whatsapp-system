// components/Avatar.tsx
import React from 'react';
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
  const sizeClass = sizeMap[size];
  const bgColor = getAvatarColor(name || 'default');
  const initials = getInitials(name || '?');

  if (imageUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback ke inisial jika gambar gagal load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white select-none ${className}`}
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