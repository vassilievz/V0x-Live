import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[10px] border border-border bg-input px-4 text-[15px] text-foreground placeholder:text-muted transition-[border-color,box-shadow] hover:border-muted focus-visible:outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/15 aria-invalid:border-danger disabled:cursor-not-allowed disabled:text-disabled disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
