import { domainPt } from "@/i18n/resources/domains/pt";

export const pt = {
  common: {
    brandHome: "V0x Live, início",
    skipToContent: "Pular para o conteúdo",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
    menu: "Menu",
    navPrimary: "Principal",
    navMobile: "Navegação mobile",
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
      discordAria: "Entrar na comunidade V0x Live no Discord (abre em nova aba)",
    },
  },
  nav: {
    exploreRooms: "Explorar salas",
    mySpace: "Meu espaço",
    mySpaceCreate: "Meu espaço / Criar sala",
    createRoom: "Criar sala",
    changeName: "Trocar nome",
    signingOut: "Saindo…",
    guest: "Visitante",
    sessionMenuAria: "Menu da sua sessão",
    sessionMenuKicker: "Conectado como",
    sessionNameLabel: "Seu nome",
    sessionNamePlaceholder: "Como quer aparecer",
    sessionAvatarLabel: "Foto por link (opcional)",
    sessionAvatarPlaceholder: "https://…",
    sessionAvatarHint: "Cole um link público de imagem. Deixe vazio para usar iniciais.",
    sessionSave: "Salvar",
    sessionSaving: "Salvando…",
    logout: "Sair",
    googleAccount: "Conta Google",
  },
  auth: {
    googleSignIn: "Entrar com Google",
  },
  footer: {
    aria: "Rodapé",
    description: "Um espaço para compartilhar a tela e o tempo com quem importa.",
    findGroup: "ENCONTRE SEU GRUPO",
    yourSpace: "SEU ESPAÇO",
    createRoom: "Criar uma sala",
    community: "COMUNIDADE",
    copyright: "© {{year}} V0x Live.",
    tagline: "Feito para estar junto.",
  },
  meta: {
    siteTitle: "V0x Live",
    htmlDescription:
      "Transmita tela, voz e vídeo em grupo pelo navegador. Salas públicas ou privadas, sem instalar nada.",
    home: "Seu grupo na mesma frequência",
    dashboard: "Seu espaço",
    rooms: "Explore salas públicas",
    notFound: "Página não encontrada",
  },
  landing: {
    hero: {
      sectionLabel: "Crie ou encontre sua sala",
      kicker: "Transmissão de tela em grupo",
      title: "Crie ou encontre sua <accent>sala</accent>",
      lead:
        "Compartilhe tela, voz e chat com quem você convidar. Sem download, direto no navegador.",
      publicRooms: "Ver salas públicas",
    },
    steps: {
      title: "Da sua tela para a sala, em três passos",
      code: "VX · flow",
      pickName: {
        title: "Escolha um nome para a sala",
        text: "Pública aparece na lista. Privada gera um código no link para compartilhar só com quem você quiser.",
      },
      shareScreen: {
        title: "Compartilhe a tela",
        text: "Aba, janela ou tela inteira. Ligue câmera e microfone quando fizer sentido para o grupo.",
      },
      sendLink: {
        title: "Mande o link",
        text: "Quem receber entra pelo navegador, no PC ou no celular — só precisa escolher um nome.",
      },
    },
    highlights: {
      title: "O essencial numa sala só",
      code: "RM · room",
      screenAudio: {
        title: "Tela e áudio",
        text: "Transmita o que está na sua tela. Ative o áudio do compartilhamento quando o navegador permitir.",
      },
      voiceChat: {
        title: "Voz e chat",
        text: "Microfone, câmera e chat na mesma sala, sem alternar entre aplicativos.",
      },
      publicPrivate: {
        title: "Público ou privado",
        text: "Salas abertas na lista ou fechadas com código e senha opcional.",
      },
    },
    about: {
      title: "O que é o V0x Live",
      text:
        "Um lugar para compartilhar a tela e passar tempo com quem você gosta. Escolha um nome, mande o link e reúna o grupo pelo navegador. Tela, voz, vídeo e chat na mesma experiência.",
      cta: "Abrir meu painel",
    },
    faq: {
      title: "Perguntas frequentes",
      code: "FAQ",
      free: {
        q: "É grátis?",
        a: "Sim. Crie salas, converse e compartilhe a tela sem pagar.",
      },
      install: {
        q: "Preciso instalar algo?",
        a: "Não. Funciona no navegador. Escolha um nome e entre.",
      },
      mobile: {
        q: "Funciona no celular?",
        a: "Dá para assistir e usar chat no celular. Para transmitir a tela, o computador costuma funcionar melhor.",
      },
    },
  },
  createRoom: {
    label: "Nova sala",
    title: "Comece com um nome",
    fieldLabel: "Nome da sala",
    placeholder: "Ex.: maratona de série",
    submit: "Criar sala",
    footGuest: "Sem cadastro — só um nome.",
    statusOnline: "Serviço online",
    statusOffline: "Serviço indisponível",
    statusChecking: "Verificando…",
  },
  notFound: {
    titleLine1: "Esse sinal",
    titleLine2: "não chegou.",
    body:
      "Página não encontrada. O endereço pode ter mudado ou a sala já foi encerrada.",
    backHome: "Voltar ao início",
  },
  ...domainPt,
} as const;

type LeafStrings<T> = T extends object
  ? { [K in keyof T]: LeafStrings<T[K]> }
  : string;

export type TranslationResource = LeafStrings<typeof pt>;
