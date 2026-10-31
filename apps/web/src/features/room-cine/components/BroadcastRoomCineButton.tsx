import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Clapperboard } from "lucide-react";
import { roomsApi } from "@/lib/api";
import { CINE_OPEN_CATALOG_EVENT } from "@/features/room-cine/cineEvents";
import { RoomCineDialog } from "@/features/room-cine/components/RoomCineDialog";
import { useRoomCine } from "@/features/room-cine/RoomCineContext";

type Props = {
  roomId: string;
  viewerRole: string | null;
  compact?: boolean;
};

export function BroadcastRoomCineButton({ roomId, viewerRole, compact }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const cineCtx = useRoomCine();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canControl = cineCtx?.canControl === true || viewerRole === "host";

  useEffect(() => {
    const onOpen = () => {
      setError(null);
      setOpen(true);
    };
    window.addEventListener(CINE_OPEN_CATALOG_EVENT, onOpen);
    return () => window.removeEventListener(CINE_OPEN_CATALOG_EVENT, onOpen);
  }, []);

  const upsert = useMutation({
    mutationFn: (body: Parameters<typeof roomsApi.setCine>[1]) => roomsApi.setCine(roomId, body),
    onSuccess: (data) => {
      setOpen(false);
      setError(null);
      queryClient.setQueryData(["room-cine", roomId], data);
    },
    onError: (err: Error) => setError(err.message),
  });

  const patch = useMutation({
    mutationFn: (body: Parameters<typeof roomsApi.patchCine>[1]) => roomsApi.patchCine(roomId, body),
    onSuccess: (data) => queryClient.setQueryData(["room-cine", roomId], data),
    onError: (err: Error) => setError(err.message),
  });

  const stop = useMutation({
    mutationFn: () => roomsApi.stopCine(roomId),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-cine", roomId], data);
      setOpen(false);
    },
  });

  return (
    <>
      <button
        type="button"
        className="lk-button broadcast-control-bar-btn"
        aria-label={t("cine.buttonAria")}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Clapperboard size={16} aria-hidden="true" />
        {compact ? t("cine.buttonLabelShort") : t("cine.buttonLabel")}
      </button>
      <RoomCineDialog
        open={open}
        onClose={() => setOpen(false)}
        canControl={canControl}
        state={cineCtx?.state}
        pending={upsert.isPending || patch.isPending || stop.isPending}
        error={error}
        onStartCatalog={(body) => upsert.mutate(body)}
        onStartDirect={(body) => upsert.mutate(body)}
        onPatch={(body) => patch.mutate(body)}
        onStop={() => stop.mutate()}
      />
    </>
  );
}
