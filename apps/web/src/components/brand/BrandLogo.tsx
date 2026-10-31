import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "framer-motion";
import { logoPulse } from "@/motion/presets";

const sizes = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  hero: "h-20 w-auto sm:h-28 md:h-32",
} as const;

type Props = {
  size?: keyof typeof sizes;
  layoutId?: string;
  pulse?: boolean;
  className?: string;
};

export function BrandLogo({
  size = "md",
  layoutId = "v0x-logo",
  pulse = false,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const shouldPulse = pulse && !reduced;

  return (
    <motion.img
      layoutId={layoutId}
      src="/brand-mark.webp"
      width={155}
      height={144}
      alt="V0x Live"
      className={cn("w-auto object-contain", sizes[size], className)}
      animate={shouldPulse ? logoPulse.animate : undefined}
      transition={shouldPulse ? logoPulse.transition : undefined}
    />
  );
}
