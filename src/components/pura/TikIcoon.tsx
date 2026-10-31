import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TikIcoonProps = Omit<ButtonProps, 'size' | 'variant' | 'aria-label'> & {
  'aria-label': string;
};

/** Standard icon button for compact rows: a size-4 icon in a small layout slot,
 * with an invisible, at least 44 × 44 px tap target and the shared Button focus ring.
 * Leave room between neighbours where possible: expanded tap targets can overlap.
 */
export const TikIcoon = forwardRef<HTMLButtonElement, TikIcoonProps>(
  ({ className, type = 'button', ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      type={type}
      variant="ghost"
      size="touch-icon"
      className={cn("relative size-6 shrink-0 after:absolute after:left-1/2 after:top-1/2 after:h-11 after:min-w-11 after:w-full after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']", className)}
    />
  ),
);
TikIcoon.displayName = 'TikIcoon';