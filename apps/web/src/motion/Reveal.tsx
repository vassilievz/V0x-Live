import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { itemFadeUp } from "@/motion/presets";

type RevealProps = {
  as?: "div" | "li";
  children: ReactNode;
} & Omit<HTMLMotionProps<"div">, "children"> &
  Omit<HTMLMotionProps<"li">, "children">;

export function Reveal({ children, as = "div", ...rest }: RevealProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const liRef = useRef<HTMLLIElement>(null);
  const ref = as === "li" ? liRef : divRef;
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const motionProps = {
    variants: itemFadeUp,
    initial: "hidden" as const,
    animate: inView ? ("visible" as const) : ("hidden" as const),
  };

  if (as === "li") {
    const { ref: _ignored, ...liRest } = rest as HTMLMotionProps<"li">;
    return (
      <motion.li ref={liRef} {...motionProps} {...liRest}>
        {children}
      </motion.li>
    );
  }

  const { ref: _ignored, ...divRest } = rest as HTMLMotionProps<"div">;
  return (
    <motion.div ref={divRef} {...motionProps} {...divRest}>
      {children}
    </motion.div>
  );
}
