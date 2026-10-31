export const easeOut = [0.22, 1, 0.36, 1] as const;

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: easeOut },
};

export const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const itemFadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

export const logoPulse = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.92, 1, 0.92],
  },
  transition: {
    duration: 3.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};
