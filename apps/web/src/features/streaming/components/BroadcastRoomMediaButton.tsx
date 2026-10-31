import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MonitorPlay } from "lucide-react";
import { roomsApi } from "@/lib/api";
import { RoomMusicAddDialog } from "@/features/room-music/components/RoomMusicAddDialog";

type Props = {
  roomId: string;
  compact?: boolean;
};

export function BroadcastRoomMediaButton({ roomId, compact }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedia = useMutation({
    mutationFn: (body: { url: string; control_mode: "owner_only" | "everyone" }) =>
      roomsApi.setMusic(roomId, body),
    onSuccess: (data) => {
      setOpen(false);
      setError(null);
      queryClient.setQueryData(["room-music", roomId], data);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <>
      <button
        type="button"
        className="lk-button broadcast-control-bar-btn"
        aria-label={t("music.addMedia")}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <MonitorPlay size={16} aria-hidden="true" />
        {compact ? t("music.addMediaButtonShort") : t("music.addMediaButton")}
      </button>
      <RoomMusicAddDialog
        open={open}
        onClose={() => setOpen(false)}
        pending={addMedia.isPending}
        error={error}
        onSubmit={(payload) => addMedia.mutate(payload)}
      />
    </>
  );
}
