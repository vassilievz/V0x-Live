import type { RealtimeEvent } from "@v0xlive/api-client";

const PARTICIPANT_EVENT_PREFIX = "room.participant";

export function isParticipantRealtimeEvent(event: RealtimeEvent | null | undefined): boolean {
  if (!event?.type) {
    return false;
  }
  return (
    event.type === PARTICIPANT_EVENT_PREFIX + ".joined" ||
    event.type === PARTICIPANT_EVENT_PREFIX + ".left" ||
    event.type === "participant.muted"
  );
}
