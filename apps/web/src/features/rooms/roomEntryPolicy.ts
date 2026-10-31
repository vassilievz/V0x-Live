import type { RoomEntryInfo } from "@v0xlive/api-client";

/** Whether the client may call join without showing the access gate. */
export function mayAutoJoinFromEntry(entry: RoomEntryInfo): boolean {
  if (entry.password_required) {
    return false;
  }
  if (entry.can_resume === true || entry.is_host === true) {
    return true;
  }
  return entry.direct_join_allowed !== false;
}

export function needsRoomInviteGate(entry: RoomEntryInfo): boolean {
  return (
    entry.direct_join_allowed === false &&
    entry.can_resume !== true &&
    entry.is_host !== true
  );
}
