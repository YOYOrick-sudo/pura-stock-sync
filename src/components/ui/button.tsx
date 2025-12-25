import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-polar-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-primary/20 hover:opacity-90 hover:shadow-none",
        destructive: "bg-destructive text-destructive-foreground border-destructive/20 hover:opacity-90 hover:shadow-none",
        outline: "border-border bg-transparent text-foreground hover:bg-muted/50 hover:shadow-none",
        secondary: "bg-secondary text-secondary-foreground border-border hover:bg-white/80 hover:shadow-none",
        ghost: "text-foreground border-transparent shadow-none hover:bg-muted/50 hover:border-border/50",
        link: "text-primary border-transparent shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm rounded-polar-md",
        lg: "h-14 px-8 py-4 text-base rounded-polar-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
