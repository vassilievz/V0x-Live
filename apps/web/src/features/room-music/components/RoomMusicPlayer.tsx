import { useRoomDirectVideoRequired } from "@/features/room-music/RoomDirectVideoContext";

type Props = {
  viewerRole?: string | null;
};

/** Mídia da sala é exibida no palco principal; o card lateral foi desativado. */
export function RoomMusicPlayer(_props: Props) {
  const ctx = useRoomDirectVideoRequired();
  if (ctx.state?.active === true) {
    return null;
  }
  return null;
}
