import { DEFAULT_GUEST_DISPLAY_NAME, type AuthUser, type RoomEntryInfo } from "@v0xlive/api-client";
import { needsRoomInviteGate } from "@/features/rooms/roomEntryPolicy";

export const NICK_CONFIRMED_STORAGE_KEY = "vox_nick_confirmed";

export function isNickConfirmedThisSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(NICK_CONFIRMED_STORAGE_KEY) === "true";
}

export function markNickConfirmedThisSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(NICK_CONFIRMED_STORAGE_KEY, "true");
}

export function isDefaultGuestDisplayName(name: string | undefined): boolean {
  if (!name?.trim()) {
    return true;
  }
  return name.trim().toLowerCase() === DEFAULT_GUEST_DISPLAY_NAME.toLowerCase();
}

export function isAuthenticatedMember(user: AuthUser | undefined): boolean {
  return Boolean(user && !user.is_guest);
}

/** Visitors must pick a nick before join; OAuth hosts and resume skip this gate. */
export function needsNickEntryGate(
  entry: RoomEntryInfo | undefined,
  user: AuthUser | undefined,
  hasSession: boolean,
): boolean {
  if (!entry) {
    if (!hasSession) {
      return true;
    }
    if (isAuthenticatedMember(user)) {
      return false;
    }
    if (!isNickConfirmedThisSession()) {
      return true;
    }
    return isDefaultGuestDisplayName(user?.display_name);
  }
  if (isAuthenticatedMember(user)) {
    return false;
  }
  if (entry.is_host === true || entry.can_resume === true) {
    return false;
  }
  if (!isNickConfirmedThisSession()) {
    return true;
  }
  if (!hasSession) {
    return true;
  }
  return isDefaultGuestDisplayName(user?.display_name);
}

export function mayAutoJoinRoomEntry(
  entry: RoomEntryInfo,
  user: AuthUser | undefined,
  hasSession: boolean,
): boolean {
  if (!hasSession || needsNickEntryGate(entry, user, hasSession)) {
    return false;
  }
  if (entry.password_required || needsRoomInviteGate(entry)) {
    return false;
  }
  if (entry.can_resume === true || entry.is_host === true) {
    return true;
  }
  if (isAuthenticatedMember(user)) {
    return true;
  }
  if (isNickConfirmedThisSession()) {
    return entry.direct_join_allowed !== false;
  }
  return false;
}
