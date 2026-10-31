import { cn } from "@/lib/cn";
import { homeAboutArt, homeAboutArtImage, homeAboutArtImageGif } from "@/ui";

const ABOUT_ART_GIF = "/media/twitter_2031355291540070479.gif";

export function AboutSculptureArt() {
  return (
    <div className={homeAboutArt} aria-hidden="true">
      <img
        src={ABOUT_ART_GIF}
        alt=""
        className={cn(homeAboutArtImage, homeAboutArtImageGif)}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
