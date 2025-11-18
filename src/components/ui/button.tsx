import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-polar-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#1B7867] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] hover:bg-[#22907C]",
        destructive: "bg-[#DC2626] text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] hover:bg-[#B91C1C]",
        outline: "border border-[rgba(197,197,202,0.5)] bg-transparent text-[#282E3A] hover:bg-[#F6F7DD] hover:border-[rgba(197,197,202,0.7)]",
        secondary: "bg-[#F6F7DD] text-[#282E3A] border border-[rgba(197,197,202,0.5)] hover:bg-[#EBEBC8]",
        ghost: "bg-transparent text-[#282E3A] hover:bg-[#F6F7DD]",
        link: "text-[#1B7867] underline-offset-4 hover:underline hover:text-[#156152]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm rounded-polar-lg",
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
