import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PolarAvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'default' | 'large';
  initials?: string;
  fallbackIcon?: React.ReactNode;
  online?: boolean;
}

const sizeConfig = {
  small: { container: 'w-8 h-8 text-[13px]', iconSize: 16, indicator: 'w-2 h-2' },
  default: { container: 'w-10 h-10 text-[15px]', iconSize: 20, indicator: 'w-2.5 h-2.5' },
  large: { container: 'w-14 h-14 text-xl', iconSize: 28, indicator: 'w-3.5 h-3.5' },
} as const;

export function PolarAvatar({
  src,
  alt = 'User avatar',
  size = 'default',
  initials,
  fallbackIcon,
  online,
}: PolarAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const config = sizeConfig[size];

  const showImage = src && !imageError;
  const showInitials = !showImage && initials;
  const showIcon = !showImage && !showInitials;

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full border border-border flex items-center justify-center overflow-hidden font-semibold text-foreground',
          showImage ? 'bg-transparent' : 'bg-background',
          config.container,
        )}
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
        {showIcon && (fallbackIcon || <User size={config.iconSize} className="text-foreground" />)}
      </div>

      {online !== undefined && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-card',
            online ? 'bg-success' : 'bg-muted-foreground',
            config.indicator,
          )}
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

const groupSizeConfig = {
  small: { px: 32, overlapClass: '-ml-2', container: 'w-8 h-8 text-[13px]' },
  default: { px: 40, overlapClass: '-ml-2.5', container: 'w-10 h-10 text-[15px]' },
  large: { px: 56, overlapClass: '-ml-3.5', container: 'w-14 h-14 text-lg' },
} as const;

export function PolarAvatarGroup({
  avatars,
  max = 3,
  size = 'default',
}: PolarAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const config = groupSizeConfig[size];

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(index > 0 && config.overlapClass)}
          style={{ zIndex: visibleAvatars.length - index }}
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
          className={cn(
            'rounded-full bg-background border border-border flex items-center justify-center font-semibold text-foreground z-0',
            config.overlapClass,
            config.container,
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
