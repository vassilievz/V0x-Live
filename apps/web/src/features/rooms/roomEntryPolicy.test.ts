import { describe, expect, it } from "vitest";
import { mayAutoJoinFromEntry, needsRoomInviteGate } from "./roomEntryPolicy";

describe("roomEntryPolicy", () => {
  it("allows host on private room without can_resume", () => {
    const entry = {
      id: "1",
      name: "Sala",
      visibility: "private",
      password_required: false,
      direct_join_allowed: false,
      can_resume: false,
      is_host: true,
    };
    expect(mayAutoJoinFromEntry(entry)).toBe(true);
    expect(needsRoomInviteGate(entry)).toBe(false);
  });

  it("requires invite gate for private visitor", () => {
    const entry = {
      id: "1",
      name: "Sala",
      visibility: "private",
      password_required: false,
      direct_join_allowed: false,
      can_resume: false,
      is_host: false,
    };
    expect(mayAutoJoinFromEntry(entry)).toBe(false);
    expect(needsRoomInviteGate(entry)).toBe(true);
  });
});
