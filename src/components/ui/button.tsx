import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(226,119,38,0.2)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#E27726] text-white hover:bg-[#C9630E]",
        destructive: "bg-[#EF4444] text-white hover:bg-[#B91C1C]",
        outline: "border border-[#C1C5CF] bg-white text-[#303542] hover:bg-[#F8F9FA]",
        secondary: "border border-[#C1C5CF] bg-white text-[#303542] hover:bg-[#F8F9FA]",
        ghost: "bg-transparent text-[#4A4F5E] hover:bg-[#F1F3F5]",
        link: "text-[#E27726] underline-offset-4 hover:underline",
        soft: "bg-[#FFF7ED] text-[#A5500D] hover:bg-[#FFEDD5]",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-2.5 text-[13px]",
        default: "h-9 px-3.5 text-[13px]",
        lg: "h-10 px-[18px] text-sm",
        icon: "h-9 w-9",
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
