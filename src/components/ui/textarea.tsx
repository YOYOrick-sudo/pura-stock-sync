import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-[14px] border border-[#C1C5CF] bg-white px-3 py-2.5 text-[13px] text-[#282E3A] ring-offset-background placeholder:text-[#8D93A0] focus-visible:outline-none focus-visible:border-[#E27726] focus-visible:ring-[2px] focus-visible:ring-[rgba(226,119,38,0.2)] disabled:cursor-not-allowed disabled:bg-[#F1F3F5] disabled:text-[#8D93A0] disabled:opacity-50 transition-colors resize-y aria-[invalid=true]:border-[#EF4444] aria-[invalid=true]:focus-visible:border-[#EF4444] aria-[invalid=true]:focus-visible:ring-[rgba(239,68,68,0.2)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
