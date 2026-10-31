import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { googleAuthStartUrl } from "@/lib/api";
import { googleSignInLink } from "@/ui";

function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      className="block shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.203 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.659 0 5.078 1.036 6.867 2.724l5.657-5.657C34.046 10.089 29.268 8 24 8 14.059 8 6 16.059 6 26s8.059 18 18 18 18-8.059 18-18c0-1.174-.107-2.322-.389-3.417z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c2.659 0 5.078 1.036 6.867 2.724l5.657-5.657C34.046 10.089 29.268 8 24 8 16.318 8 9.656 13.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A10.902 10.902 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 26c0-1.174-.107-2.322-.389-3.417z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  className?: string;
};

export function GoogleSignInButton({ className }: GoogleSignInButtonProps) {
  const { t } = useTranslation();

  return (
    <a href={googleAuthStartUrl()} className={cn(googleSignInLink, className)}>
      <GoogleMark />
      <span className="truncate">{t("auth.googleSignIn")}</span>
    </a>
  );
}
