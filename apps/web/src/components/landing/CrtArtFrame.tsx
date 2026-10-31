import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ParticleShimmer } from "@/components/landing/ParticleShimmer";
import {
  crtArtCompact,
  crtArtGlyph,
  crtArtHero,
  crtArtLayerRgb,
  crtArtParticles,
  crtArtScanlines,
  crtArtVignette,
} from "@/ui";

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
  const variantClass =
    variant === "compact" ? crtArtCompact : variant === "glyph" ? crtArtGlyph : crtArtHero;

  return (
    <div className={cn(variantClass, className)} aria-hidden="true">
      <div className={crtArtLayerRgb}>{children}</div>
      <div className={crtArtScanlines} />
      <div className={crtArtVignette} />
      {shimmer ? (
        <ParticleShimmer className={crtArtParticles} density={variant === "hero" ? 56 : 24} />
      ) : null}
    </div>
  );
}
