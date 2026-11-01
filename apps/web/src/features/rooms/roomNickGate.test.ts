import { describe, expect, it } from "vitest";
import { mayAutoJoinRoomEntry, needsNickEntryGate } from "./roomNickGate";

const publicEntry = {
  id: "1",
  name: "Sala",
  visibility: "public",
  password_required: false,
  direct_join_allowed: true,
  can_resume: false,
  is_host: false,
};

describe("roomNickGate", () => {
  it("requires nick for visitor without session", () => {
    expect(needsNickEntryGate(publicEntry, undefined, false)).toBe(true);
    expect(mayAutoJoinRoomEntry(publicEntry, undefined, false)).toBe(false);
  });

  it("allows auto join for OAuth member", () => {
    expect(
      needsNickEntryGate(publicEntry, { is_guest: false } as never, true),
    ).toBe(false);
    expect(
      mayAutoJoinRoomEntry(publicEntry, { is_guest: false } as never, true),
    ).toBe(true);
  });

  it("requires nick before entry payload loads for default guest session", () => {
    expect(
      needsNickEntryGate(undefined, { is_guest: true, display_name: "Guest" }, true),
    ).toBe(true);
  });
});
