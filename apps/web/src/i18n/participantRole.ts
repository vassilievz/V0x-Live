import { domainPt } from "@/i18n/resources/domains/pt";

type ParticipantRole = keyof typeof domainPt.participants.roles;

export function participantRoleKey(role: string): ParticipantRole {
  switch (role) {
    case "host":
    case "moderator":
    case "participant":
    case "guest":
      return role;
    default: {
      return "participant";
    }
  }
}
