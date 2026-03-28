import React from 'react';
import { User } from 'lucide-react';
import { PolarColors } from './colors';

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
        style={{
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
          borderRadius: '50%',
          backgroundColor: showImage ? 'transparent' : 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
          fontSize: fontSize,
          fontWeight: 600,
          color: 'hsl(var(--foreground))',
        }}
      >
        {showImage && (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {showInitials && initials}
        {showIcon && (fallbackIcon || <User size={iconSize} color="hsl(var(--foreground))" />)}
      </div>
      
      {online !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: `${avatarSize * 0.25}px`,
            height: `${avatarSize * 0.25}px`,
            borderRadius: '50%',
            backgroundColor: online ? PolarColors.avatar.online : PolarColors.avatar.offline,
            border: '2px solid hsl(var(--card))',
          }}
        />
      )}
    </div>
  );
}

// Avatar Group for stacked avatars
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

  const sizeMap = {
    small: 32,
    default: 40,
    large: 56,
  };

  const avatarSize = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
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
          style={{
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: size === 'small' ? '13px' : size === 'large' ? '18px' : '15px',
            fontWeight: 600,
            color: 'hsl(var(--foreground))',
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
