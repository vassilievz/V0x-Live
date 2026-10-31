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

export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const trimmed = src?.trim();
  const showImage = Boolean(trimmed);

  return (
    <span
      className={
        className
          ? `user-avatar user-avatar--${size} ${className}`
          : `user-avatar user-avatar--${size}`
      }
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        <img src={trimmed} alt="" referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        <span className="user-avatar-fallback">{initialsFromName(name)}</span>
      )}
    </span>
  );
}
