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
import { cn } from "@/lib/cn";
import {
  actionLink,
  actionLinkOutline,
  actionLinkPill,
  homeAccentWord,
  homeBentoPanel,
  homeCellCode,
  homeHero,
  homeHeroInner,
  homeHeroCopy,
  homeHeroFormWrap,
  homeHeroGrid,
  homeHeroLinks,
  homeHeroTitle,
  homeHighlightGrid,
  homeKicker,
  homeLead,
  homeSectionHead,
  homeSectionTitle,
  homeStepList,
  homeAboutLayout,
  homeAboutCopy,
  homeAboutText,
  homeFaqBody,
  homeFaqItem,
  homeFaqList,
  homeStepNum,
  textLink,
  textLinkMuted,
} from "@/ui";

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
        <section className={cn(homeHero, homeBentoPanel)} aria-labelledby="home-title">
          <HeroKnightArt />
          <div className={homeHeroInner}>
            <div className={homeHeroGrid}>
              <motion.div
                className={homeHeroCopy}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
              >
                <p className={homeKicker}>
                  <span className={cn(homeCellCode, "mb-0")}>HL-00</span>
                  {t("landing.hero.kicker")}
                </p>
                <h1 id="home-title" className={homeHeroTitle}>
                  <Trans
                    i18nKey="landing.hero.title"
                    components={{
                      accent: <span className={homeAccentWord} />,
                    }}
                  />
                </h1>
                <p className={homeLead}>{t("landing.hero.lead")}</p>
                <div className={homeHeroLinks}>
                  <Link to="/rooms" className={cn(actionLink, actionLinkPill)}>
                    {t("landing.hero.publicRooms")} <ArrowUpRight aria-hidden="true" />
                  </Link>
                  <Link to="/dashboard" className={cn(textLink, textLinkMuted)}>
                    {t("nav.mySpace")} <ArrowUpRight aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className={homeHeroFormWrap}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
              >
                <CreateRoomHeroForm />
              </motion.div>
            </div>
          </div>
        </section>

        <section className={cn("bg-background", homeBentoPanel)} aria-labelledby="steps-title">
          <Reveal>
            <div className={homeSectionHead}>
              <h2 id="steps-title" className={homeSectionTitle}>
                {t("landing.steps.title")}
              </h2>
              <span className={homeCellCode}>{t("landing.steps.code")}</span>
            </div>
          </Reveal>
          <ul className={homeStepList}>
            {STEP_DEFS.map((step, index) => (
              <StepHalftoneCell key={step.code} code={step.code}>
                <span className={homeCellCode}>{step.code}</span>
                <span className={homeStepNum} aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{t(`landing.steps.${step.key}.title`)}</h3>
                <p>{t(`landing.steps.${step.key}.text`)}</p>
              </StepHalftoneCell>
            ))}
          </ul>
        </section>

        <section className={cn("bg-background", homeBentoPanel)} aria-labelledby="highlights-title">
          <Reveal>
            <div className={homeSectionHead}>
              <h2 id="highlights-title" className={homeSectionTitle}>
                {t("landing.highlights.title")}
              </h2>
              <span className={homeCellCode}>{t("landing.highlights.code")}</span>
            </div>
          </Reveal>
          <ul className={homeHighlightGrid}>
            {HIGHLIGHT_DEFS.map((item) => (
              <HighlightHalftoneCell key={item.code} code={item.code}>
                <span className={homeCellCode}>{item.code}</span>
                <h3>{t(`landing.highlights.${item.key}.title`)}</h3>
                <p>{t(`landing.highlights.${item.key}.text`)}</p>
              </HighlightHalftoneCell>
            ))}
          </ul>
        </section>

        <section className={cn("bg-background", homeBentoPanel)} aria-labelledby="about-title">
          <Reveal>
            <div className={homeAboutLayout}>
              <div className={homeAboutCopy}>
                <span className={homeCellCode}>AB-01</span>
                <h2 id="about-title" className={homeSectionTitle}>
                  {t("landing.about.title")}
                </h2>
                <p className={homeAboutText}>{t("landing.about.text")}</p>
                <Link to="/dashboard" className={cn(actionLink, actionLinkOutline, actionLinkPill, "mt-6")}>
                  {t("landing.about.cta")} <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
              <AboutSculptureArt />
            </div>
          </Reveal>
        </section>

        <section className={cn("bg-background", homeBentoPanel)} aria-labelledby="faq-title">
          <Reveal>
            <div className={homeSectionHead}>
              <h2 id="faq-title" className={homeSectionTitle}>
                {t("landing.faq.title")}
              </h2>
              <span className={homeCellCode}>{t("landing.faq.code")}</span>
            </div>
          </Reveal>
          <div className={homeFaqList}>
            {FAQ_KEYS.map((key) => (
              <Reveal key={key}>
                <details className={homeFaqItem}>
                  <summary>{t(`landing.faq.${key}.q`)}</summary>
                  <div className={homeFaqBody}>
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
