import React from 'react';
import { User } from 'lucide-react';

export interface PolarAvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'default' | 'large';
  initials?: string;
  fallbackIcon?: React.ReactNode;
  online?: boolean;
}

export function PolarAvatar({
  src,
  alt = 'User avatar',
  size = 'default',
  initials,
  fallbackIcon,
  online,
}: PolarAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeMap = {
    small: { size: 32, fontSize: '13px', iconSize: 16 },
    default: { size: 40, fontSize: '15px', iconSize: 20 },
    large: { size: 56, fontSize: '20px', iconSize: 28 },
  };

  const { size: avatarSize, fontSize, iconSize } = sizeMap[size];

  const showImage = src && !imageError;
  const showInitials = !showImage && initials;
  const showIcon = !showImage && !showInitials;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className={`rounded-full flex items-center justify-center overflow-hidden font-semibold ${showImage ? '' : 'bg-muted border border-border text-muted-foreground'}`}
        style={{
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
          fontSize: fontSize,
        }}
      >
        {showImage && (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        )}
        {showInitials && initials}
        {showIcon && (fallbackIcon || <User size={iconSize} className="text-muted-foreground" />)}
      </div>
      
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 rounded-full border-2 border-card ${online ? 'bg-success' : 'bg-muted-foreground'}`}
          style={{
            width: `${avatarSize * 0.25}px`,
            height: `${avatarSize * 0.25}px`,
          }}
        />
      )}
    </div>
  );
}

export interface PolarAvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    initials?: string;
  }>;
  max?: number;
  size?: 'small' | 'default' | 'large';
}

export function PolarAvatarGroup({
  avatars,
  max = 3,
  size = 'default',
}: PolarAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const sizeMap = { small: 32, default: 40, large: 56 };
  const avatarSize = sizeMap[size];

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          style={{
            marginLeft: index > 0 ? `-${avatarSize * 0.25}px` : '0',
            zIndex: visibleAvatars.length - index,
          }}
        >
          <PolarAvatar
            src={avatar.src}
            alt={avatar.alt}
            initials={avatar.initials}
            size={size}
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="rounded-full bg-muted border border-border flex items-center justify-center font-semibold text-muted-foreground"
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            fontSize: size === 'small' ? '13px' : size === 'large' ? '18px' : '15px',
            marginLeft: `-${avatarSize * 0.25}px`,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
