import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "hover-surface hover-surface--btn-primary bg-accent text-accent-foreground border border-border hover:bg-foreground hover:text-background hover:border-foreground",
  secondary:
    "hover-surface hover-surface--btn-secondary bg-transparent text-foreground border border-border hover:border-muted hover:bg-surface-muted",
  ghost:
    "hover-surface hover-surface--btn-ghost text-muted hover:text-foreground hover:bg-surface-muted",
  danger:
    "hover-surface hover-surface--btn-danger bg-surface-muted text-foreground border border-border hover:bg-surface",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-surface disabled:text-disabled disabled:border-border disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
