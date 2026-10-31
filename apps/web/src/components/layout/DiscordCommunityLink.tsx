import { useTranslation } from "react-i18next";
import { DiscordIcon } from "@/components/brand/DiscordIcon";
import { cn } from "@/lib/cn";
import { discordLink } from "@/ui";

export const DISCORD_COMMUNITY_URL = "https://discord.gg/shappire";

type DiscordCommunityLinkProps = {
  variant?: "header" | "mobile" | "footer";
  className?: string;
};

export function DiscordCommunityLink({
  variant = "header",
  className,
}: DiscordCommunityLinkProps) {
  const { t } = useTranslation();
  const label = t("common.community.discord");

  return (
    <a
      href={DISCORD_COMMUNITY_URL}
      className={cn(discordLink(variant), className)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("common.community.discordAria")}
    >
      <DiscordIcon />
      <span>{label}</span>
    </a>
  );
}
