import { RoomEntryLoading } from "@/features/rooms/components/RoomEntryLoading";

export function RoomPageSuspenseFallback() {
  return <RoomEntryLoading compact />;
}
