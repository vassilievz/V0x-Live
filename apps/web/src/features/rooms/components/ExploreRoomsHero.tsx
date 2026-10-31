import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

const EXPLORE_SIGNAL_GIF = "/media/twitter_2055481496459513899.gif";
const EXPLORE_SIGNAL_POSTER = "/signal-art.webp";

type ExploreRoomsHeroProps = {
  children: ReactNode;
};

export function ExploreRoomsHero({ children }: ExploreRoomsHeroProps) {
  const reduced = useReducedMotion();

  return (
    <section className="explore-rooms-hero home-bento-panel site-panel site-panel--flush">
      <div className="explore-rooms-hero__stage" aria-hidden="true">
        <img
          src={reduced ? EXPLORE_SIGNAL_POSTER : EXPLORE_SIGNAL_GIF}
          alt=""
          className="explore-rooms-hero__gif"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div className="explore-rooms-hero__grain" />
        <div className="explore-rooms-hero__veil" />
        <div className="explore-rooms-hero__frame">
          <span className="explore-rooms-hero__frame-label">SIG · LIVE</span>
        </div>
      </div>
      <div className="explore-rooms-hero__content">{children}</div>
    </section>
  );
}
