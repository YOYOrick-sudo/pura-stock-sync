import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:opacity-90",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/40 bg-transparent text-destructive",
        outline: "border-border bg-transparent text-foreground",
        success: "border-success/40 bg-transparent text-success",
        warning: "border-warning/40 bg-transparent text-warning",
        error: "border-destructive/40 bg-transparent text-destructive",
        info: "border-info/40 bg-transparent text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
