import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TikIcoonProps = Omit<ButtonProps, 'size' | 'variant' | 'aria-label'> & {
  'aria-label': string;
};

/** Standard icon button for compact rows: a size-4 icon in its own at least
 * 44 × 44 px layout slot, with the shared Button focus ring. Use a gap between
 * neighbours (gap-1 or more); the slot is fixed on every breakpoint, so never
 * add responsive size classes. Tap targets never extend outside their layout slots.
 */
export const TikIcoon = forwardRef<HTMLButtonElement, TikIcoonProps>(
  ({ className, type = 'button', ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      type={type}
      variant="ghost"
      size="touch-icon"
      className={cn('h-11 min-h-11 min-w-11 flex-none shrink-0', className)}
    />
  ),
);
TikIcoon.displayName = 'TikIcoon';