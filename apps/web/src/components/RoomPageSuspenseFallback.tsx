import { useTranslation } from "react-i18next";

export function RoomPageSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-dvh items-center justify-center text-sm text-muted"
      role="status"
    >
      {t("room.bundlePreparing")}
    </div>
  );
}
