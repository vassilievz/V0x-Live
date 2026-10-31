import type { TranslationResource } from "@/i18n/resources/pt";
import { domainEn } from "@/i18n/resources/domains/en";

export const en = {
  common: {
    brandHome: "V0x Live, home",
    skipToContent: "Skip to content",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    menu: "Menu",
    navPrimary: "Main",
    navMobile: "Mobile navigation",
    language: {
      label: "Language",
      names: {
        en: "English",
        pt: "Português",
        ru: "Русский",
        es: "Español",
      },
    },
    community: {
      discord: "Discord",
      discordAria: "Join the V0x Live community on Discord (opens in a new tab)",
    },
  },
  nav: {
    exploreRooms: "Explore rooms",
    mySpace: "My space",
    mySpaceCreate: "My space / Create room",
    createRoom: "Create room",
    changeName: "Change name",
    signingOut: "Signing out…",
    guest: "Guest",
    sessionMenuAria: "Your session menu",
    sessionMenuKicker: "Signed in as",
    sessionNameLabel: "Your name",
    sessionNamePlaceholder: "How you appear in rooms",
    sessionAvatarLabel: "Photo link (optional)",
    sessionAvatarPlaceholder: "https://…",
    sessionAvatarHint: "Paste a public image URL. Leave empty for initials.",
    sessionSave: "Save",
    sessionSaving: "Saving…",
  },
  footer: {
    aria: "Footer",
    description: "A place to share your screen and time with people who matter.",
    findGroup: "FIND YOUR GROUP",
    yourSpace: "YOUR SPACE",
    createRoom: "Create a room",
    community: "COMMUNITY",
    copyright: "© {{year}} V0x Live.",
    tagline: "Built to be together.",
  },
  meta: {
    siteTitle: "V0x Live",
    htmlDescription:
      "Stream screen, voice, and video as a group in the browser. Public or private rooms—nothing to install.",
    home: "Your group on the same wavelength",
    dashboard: "Your space",
    rooms: "Explore public rooms",
    notFound: "Page not found",
  },
  landing: {
    hero: {
      sectionLabel: "Create or find your room",
      kicker: "Group screen sharing",
      title: "Create or find your <accent>room</accent>",
      lead:
        "Share screen, voice, and chat with people you invite. No download—right in the browser.",
      publicRooms: "Browse public rooms",
    },
    steps: {
      title: "From your screen to the room in three steps",
      code: "VX · flow",
      pickName: {
        title: "Pick a name for the room",
        text: "Public rooms appear in the list. Private ones get a code in the link to share only with who you choose.",
      },
      shareScreen: {
        title: "Share your screen",
        text: "Tab, window, or full screen. Turn on camera and mic when it makes sense for the group.",
      },
      sendLink: {
        title: "Send the link",
        text: "Recipients join in the browser on desktop or mobile—just pick a name.",
      },
    },
    highlights: {
      title: "Everything essential in one room",
      code: "RM · room",
      screenAudio: {
        title: "Screen and audio",
        text: "Stream what’s on your screen. Enable share audio when the browser allows it.",
      },
      voiceChat: {
        title: "Voice and chat",
        text: "Mic, camera, and chat in the same room—no app switching.",
      },
      publicPrivate: {
        title: "Public or private",
        text: "Open rooms in the list or closed ones with a code and optional password.",
      },
    },
    about: {
      title: "What is V0x Live",
      text:
        "A place to share your screen and hang out with people you care about. Pick a name, send the link, and gather the group in the browser. Screen, voice, video, and chat in one experience.",
      cta: "Open my dashboard",
    },
    faq: {
      title: "Frequently asked questions",
      code: "FAQ",
      free: {
        q: "Is it free?",
        a: "Yes. Create rooms, chat, and share your screen at no cost.",
      },
      install: {
        q: "Do I need to install anything?",
        a: "No. It runs in the browser. Pick a name and join.",
      },
      mobile: {
        q: "Does it work on mobile?",
        a: "You can watch and use chat on mobile. Screen sharing usually works best on a computer.",
      },
    },
  },
  createRoom: {
    label: "New room",
    title: "Start with a name",
    fieldLabel: "Room name",
    placeholder: "E.g. movie marathon",
    submit: "Create room",
    footGuest: "No signup—just a name.",
    statusOnline: "Service online",
    statusOffline: "Service unavailable",
    statusChecking: "Checking…",
  },
  notFound: {
    titleLine1: "That signal",
    titleLine2: "never arrived.",
    body: "Page not found. The address may have changed or the room may have ended.",
    backHome: "Back to home",
  },
  ...domainEn,
} satisfies TranslationResource;
