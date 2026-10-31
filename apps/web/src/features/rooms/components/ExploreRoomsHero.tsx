import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import {
  exploreRoomsHero,
  exploreRoomsHeroContent,
  exploreRoomsHeroFrame,
  exploreRoomsHeroFrameLabel,
  exploreRoomsHeroGif,
  exploreRoomsHeroGrain,
  exploreRoomsHeroStage,
  exploreRoomsHeroVeil,
} from "@/ui";

const EXPLORE_SIGNAL_GIF = "/media/twitter_2055481496459513899.gif";
const EXPLORE_SIGNAL_POSTER = "/signal-art.webp";

type ExploreRoomsHeroProps = {
  children: ReactNode;
};

export function ExploreRoomsHero({ children }: ExploreRoomsHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section className={exploreRoomsHero}>
      <div className={exploreRoomsHeroStage} aria-hidden="true">
        <img
          src={reduced ? EXPLORE_SIGNAL_POSTER : EXPLORE_SIGNAL_GIF}
          alt=""
          className={exploreRoomsHeroGif}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className={exploreRoomsHeroGrain} />
        <div className={exploreRoomsHeroVeil} />
        <div className={exploreRoomsHeroFrame}>
          <span className={exploreRoomsHeroFrameLabel}>SIG · LIVE</span>
        </div>
      </div>
      <div className={exploreRoomsHeroContent}>{children}</div>
    </section>
  );
}
