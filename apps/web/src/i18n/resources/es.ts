import type { TranslationResource } from "@/i18n/resources/pt";
import { domainEs } from "@/i18n/resources/domains/es";

export const es = {
  common: {
    brandHome: "V0x Live, inicio",
    skipToContent: "Saltar al contenido",
    menuOpen: "Abrir menú",
    menuClose: "Cerrar menú",
    menu: "Menú",
    navPrimary: "Principal",
    navMobile: "Navegación móvil",
    language: {
      label: "Idioma",
      names: {
        en: "English",
        pt: "Português",
        ru: "Русский",
        es: "Español",
      },
    },
    community: {
      discord: "Discord",
      discordAria: "Unirse a la comunidad V0x Live en Discord (se abre en una pestaña nueva)",
    },
  },
  nav: {
    exploreRooms: "Explorar salas",
    mySpace: "Mi espacio",
    mySpaceCreate: "Mi espacio / Crear sala",
    createRoom: "Crear sala",
    changeName: "Cambiar nombre",
    signingOut: "Saliendo…",
    guest: "Invitado",
    sessionMenuAria: "Menú de tu sesión",
    sessionMenuKicker: "Conectado como",
    sessionNameLabel: "Tu nombre",
    sessionNamePlaceholder: "Cómo quieres aparecer",
    sessionAvatarLabel: "Foto por enlace (opcional)",
    sessionAvatarPlaceholder: "https://…",
    sessionAvatarHint: "Pega un enlace público. Vacío = iniciales.",
    sessionSave: "Guardar",
    sessionSaving: "Guardando…",
  },
  footer: {
    aria: "Pie de página",
    description: "Un espacio para compartir pantalla y tiempo con quien importa.",
    findGroup: "ENCUENTRA TU GRUPO",
    yourSpace: "TU ESPACIO",
    createRoom: "Crear una sala",
    community: "COMUNIDAD",
    copyright: "© {{year}} V0x Live.",
    tagline: "Hecho para estar juntos.",
  },
  meta: {
    siteTitle: "V0x Live",
    htmlDescription:
      "Transmite pantalla, voz y vídeo en grupo desde el navegador. Salas públicas o privadas, sin instalar nada.",
    home: "Tu grupo en la misma frecuencia",
    dashboard: "Tu espacio",
    rooms: "Explorar salas públicas",
    notFound: "Página no encontrada",
  },
  landing: {
    hero: {
      sectionLabel: "Crea o encuentra tu sala",
      kicker: "Compartir pantalla en grupo",
      title: "Crea o encuentra tu <accent>sala</accent>",
      lead:
        "Comparte pantalla, voz y chat con quien invites. Sin descargas, directo en el navegador.",
      publicRooms: "Ver salas públicas",
    },
    steps: {
      title: "De tu pantalla a la sala en tres pasos",
      code: "VX · flow",
      pickName: {
        title: "Elige un nombre para la sala",
        text: "La pública aparece en la lista. La privada genera un código en el enlace para compartir solo con quien quieras.",
      },
      shareScreen: {
        title: "Comparte la pantalla",
        text: "Pestaña, ventana o pantalla completa. Activa cámara y micrófono cuando tenga sentido para el grupo.",
      },
      sendLink: {
        title: "Envía el enlace",
        text: "Quien lo reciba entra en el navegador, en PC o móvil, con cuenta o solo un nombre.",
      },
    },
    highlights: {
      title: "Lo esencial en una sola sala",
      code: "RM · room",
      screenAudio: {
        title: "Pantalla y audio",
        text: "Transmite lo que hay en tu pantalla. Activa el audio de la compartición cuando el navegador lo permita.",
      },
      voiceChat: {
        title: "Voz y chat",
        text: "Micrófono, cámara y chat en la misma sala, sin cambiar de aplicación.",
      },
      publicPrivate: {
        title: "Pública o privada",
        text: "Salas abiertas en la lista o cerradas con código y contraseña opcional.",
      },
    },
    about: {
      title: "Qué es V0x Live",
      text:
        "Un lugar para compartir pantalla y pasar tiempo con quien te importa. Elige un nombre, envía el enlace y reúne al grupo en el navegador. Pantalla, voz, video y chat en la misma experiencia.",
      cta: "Abrir mi panel",
    },
    faq: {
      title: "Preguntas frecuentes",
      code: "FAQ",
      free: {
        q: "¿Es gratis?",
        a: "Sí. Crea salas, chatea y comparte pantalla sin pagar. La cuenta es opcional.",
      },
      install: {
        q: "¿Necesito instalar algo?",
        a: "No. Funciona en el navegador. Puedes entrar como invitado con un nombre o crear cuenta.",
      },
      mobile: {
        q: "¿Funciona en el móvil?",
        a: "Puedes ver y usar el chat en el móvil. Para transmitir pantalla, suele ir mejor en el ordenador.",
      },
    },
  },
  createRoom: {
    label: "Nueva sala",
    title: "Empieza con un nombre",
    fieldLabel: "Nombre de la sala",
    placeholder: "Ej.: maratón de series",
    submit: "Crear sala",
    footGuest: "Sin registro — solo un nombre.",
    statusOnline: "Servicio en línea",
    statusOffline: "Servicio no disponible",
    statusChecking: "Comprobando…",
  },
  notFound: {
    titleLine1: "Esa señal",
    titleLine2: "no llegó.",
    body:
      "Página no encontrada. La dirección puede haber cambiado o la sala ya terminó.",
    backHome: "Volver al inicio",
  },
  ...domainEs,
} satisfies TranslationResource;
