import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[14px] border border-[#C1C5CF] bg-white px-3 py-2 text-[13px] text-[#282E3A] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#8D93A0] focus-visible:outline-none focus-visible:border-[#E27726] focus-visible:ring-[2px] focus-visible:ring-[rgba(226,119,38,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F3F5] disabled:text-[#8D93A0] disabled:opacity-50 transition-colors aria-[invalid=true]:border-[#EF4444] aria-[invalid=true]:focus-visible:border-[#EF4444] aria-[invalid=true]:focus-visible:ring-[rgba(239,68,68,0.2)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
