import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PolarSetupCardProps {
  icon?: LucideIcon;
  title: string;
  bodyText: string;
  buttonText: string;
  onButtonClick?: () => void;
}

export function PolarSetupCard({
  icon: Icon,
  title,
  bodyText,
  buttonText,
  onButtonClick,
}: PolarSetupCardProps) {
  return (
    <div className="rounded-polar-lg bg-card p-6 w-[380px]">
      {/* White inner layer */}
      <div className="flex flex-col rounded-polar-lg bg-card p-6">
        {/* Icon */}
        {Icon && (
          <div className="rounded-polar-md mb-4 flex items-center justify-center w-12 h-12 bg-muted">
            <Icon size={24} className="text-foreground" />
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-medium text-foreground mb-2">
          {title}
        </h3>

        {/* Body Text */}
        <p className="text-sm font-normal text-muted-foreground mb-6 leading-5">
          {bodyText}
        </p>

        {/* CTA Button */}
        <button
          onClick={onButtonClick}
          className="text-[15px] font-medium text-white bg-primary border-none rounded-sm py-2.5 px-4 cursor-pointer w-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
