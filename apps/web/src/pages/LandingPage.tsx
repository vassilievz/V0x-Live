import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CreateRoomHeroForm } from "@/features/rooms/components/CreateRoomHeroForm";
import { HeroKnightArt } from "@/components/landing/HeroKnightArt";
import { AboutSculptureArt } from "@/components/landing/AboutSculptureArt";
import { HighlightHalftoneCell } from "@/components/background/HighlightHalftoneCell";
import { StepHalftoneCell } from "@/components/background/StepHalftoneCell";
import { BentoShell } from "@/components/layout/BentoShell";
import { Reveal } from "@/motion/Reveal";
import { easeOut } from "@/motion/presets";

const STEP_DEFS = [
  { code: "VX-01", key: "pickName" },
  { code: "VX-02", key: "shareScreen" },
  { code: "VX-03", key: "sendLink" },
] as const;

const HIGHLIGHT_DEFS = [
  { code: "RM-10", key: "screenAudio" },
  { code: "RM-11", key: "voiceChat" },
  { code: "RM-12", key: "publicPrivate" },
] as const;

const FAQ_KEYS = ["free", "install", "mobile"] as const;

export function LandingPage() {
  const reduced = useReducedMotion();
  const { t } = useTranslation();

  return (
    <BentoShell showMetaBar>
        <section className="home-hero home-bento-panel" aria-labelledby="home-title">
          <HeroKnightArt />
          <div className="home-hero-inner">
            <div className="home-hero-grid">
              <motion.div
                className="home-hero-copy"
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
              >
                <p className="home-kicker">
                  <span className="home-cell-code">HL-00</span>
                  {t("landing.hero.kicker")}
                </p>
                <h1 id="home-title">
                  <Trans
                    i18nKey="landing.hero.title"
                    components={{
                      accent: <span className="home-accent-word" />,
                    }}
                  />
                </h1>
                <p className="home-lead">{t("landing.hero.lead")}</p>
                <div className="home-hero-links">
                  <Link to="/rooms" className="action-link action-link--pill">
                    {t("landing.hero.publicRooms")} <ArrowUpRight aria-hidden="true" />
                  </Link>
                  <Link to="/dashboard" className="text-link text-link--muted">
                    {t("nav.mySpace")} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="home-hero-form-wrap"
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
              >
                <CreateRoomHeroForm />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="home-steps home-bento-panel" aria-labelledby="steps-title">
          <Reveal>
            <div className="home-section-head">
              <h2 id="steps-title" className="home-section-title">
                {t("landing.steps.title")}
              </h2>
              <span className="home-cell-code">{t("landing.steps.code")}</span>
            </div>
          </Reveal>
          <ul className="home-step-list">
            {STEP_DEFS.map((step, index) => (
              <StepHalftoneCell key={step.code} code={step.code}>
                <span className="home-cell-code">{step.code}</span>
                <span className="home-step-num" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{t(`landing.steps.${step.key}.title`)}</h3>
                <p>{t(`landing.steps.${step.key}.text`)}</p>
              </StepHalftoneCell>
            ))}
          </ul>
        </section>

        <section className="home-highlights home-bento-panel" aria-labelledby="highlights-title">
          <Reveal>
            <div className="home-section-head">
              <h2 id="highlights-title" className="home-section-title">
                {t("landing.highlights.title")}
              </h2>
              <span className="home-cell-code">{t("landing.highlights.code")}</span>
            </div>
          </Reveal>
          <ul className="home-highlight-grid">
            {HIGHLIGHT_DEFS.map((item) => (
              <HighlightHalftoneCell key={item.code} code={item.code}>
                <span className="home-cell-code">{item.code}</span>
                <h3>{t(`landing.highlights.${item.key}.title`)}</h3>
                <p>{t(`landing.highlights.${item.key}.text`)}</p>
              </HighlightHalftoneCell>
            ))}
          </ul>
        </section>

        <section className="home-about home-bento-panel" aria-labelledby="about-title">
          <Reveal>
            <div className="home-about-layout">
              <div className="home-about-copy">
                <span className="home-cell-code">AB-01</span>
                <h2 id="about-title" className="home-section-title">
                  {t("landing.about.title")}
                </h2>
                <p className="home-about-text">{t("landing.about.text")}</p>
                <Link to="/dashboard" className="action-link action-link--outline action-link--pill">
                  {t("landing.about.cta")} <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
              <AboutSculptureArt />
            </div>
          </Reveal>
        </section>

        <section className="home-faq home-bento-panel" aria-labelledby="faq-title">
          <Reveal>
            <div className="home-section-head">
              <h2 id="faq-title" className="home-section-title">
                {t("landing.faq.title")}
              </h2>
              <span className="home-cell-code">{t("landing.faq.code")}</span>
            </div>
          </Reveal>
          <div className="home-faq-list">
            {FAQ_KEYS.map((key) => (
              <Reveal key={key}>
                <details className="home-faq-item">
                  <summary>{t(`landing.faq.${key}.q`)}</summary>
                  <div className="home-faq-body">
                    <p>{t(`landing.faq.${key}.a`)}</p>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </section>
    </BentoShell>
  );
}
