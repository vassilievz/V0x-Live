import { cn } from "@/lib/cn";
import {
  userAvatarBase,
  userAvatarFallback,
  userAvatarLg,
  userAvatarMd,
  userAvatarSm,
} from "@/ui";

type UserAvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const sizeClass = {
  sm: userAvatarSm,
  md: userAvatarMd,
  lg: userAvatarLg,
} as const;

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const trimmed = src?.trim();
  const showImage = Boolean(trimmed);

  return (
    <span
      className={cn(userAvatarBase, sizeClass[size], className)}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        <img src={trimmed} alt="" referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        <span className={userAvatarFallback}>{initialsFromName(name)}</span>
      )}
    </span>
  );
}
