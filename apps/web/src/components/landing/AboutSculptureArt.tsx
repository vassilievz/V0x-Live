const ABOUT_ART_GIF = "/media/twitter_2031355291540070479.gif";

export function AboutSculptureArt() {
  return (
    <div className="home-about-art" aria-hidden="true">
      <img
        src={ABOUT_ART_GIF}
        alt=""
        className="home-about-art-image home-about-art-image--gif"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
