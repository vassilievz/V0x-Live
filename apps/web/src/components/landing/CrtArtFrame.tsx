import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ParticleShimmer } from "@/components/landing/ParticleShimmer";

type Props = {
  children: ReactNode;
  className?: string;
  shimmer?: boolean;
  variant?: "hero" | "compact" | "glyph";
};

export function CrtArtFrame({
  children,
  className,
  shimmer = false,
  variant = "hero",
}: Props) {
  return (
    <div
      className={cn("crt-art", `crt-art--${variant}`, className)}
      aria-hidden="true"
    >
      <div className="crt-art__layer crt-art__layer--rgb">{children}</div>
      <div className="crt-art__scanlines" />
      <div className="crt-art__vignette" />
      {shimmer ? <ParticleShimmer className="crt-art__particles" density={variant === "hero" ? 56 : 24} /> : null}
    </div>
  );
}
