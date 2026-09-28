import React, { useState, useEffect } from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
  ...props
}) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (fullName: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getColorClass = (fullName: string): string => {
    let hash = 0;
    const str = fullName || 'User';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 5;
    const colors = [
      'bg-indigo-600 text-indigo-50 border-indigo-500',
      'bg-emerald-600 text-emerald-50 border-emerald-500',
      'bg-amber-600 text-amber-50 border-amber-500',
      'bg-rose-600 text-rose-50 border-rose-500',
      'bg-sky-600 text-sky-50 border-sky-500',
    ];
    return colors[index];
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-16 h-16 text-xl font-semibold',
    xl: 'w-24 h-24 text-3xl font-bold',
  };

  const initials = getInitials(name);
  const colorClass = getColorClass(name);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border shrink-0 ${sizes[size]} ${colorClass} ${className}`}
      {...props}
    >
      <span className="select-none font-bold uppercase">{initials}</span>
      {src && !imgError && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};
