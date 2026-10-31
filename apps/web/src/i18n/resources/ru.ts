import type { TranslationResource } from "@/i18n/resources/pt";
import { domainRu } from "@/i18n/resources/domains/ru";

export const ru = {
  common: {
    brandHome: "V0x Live, главная",
    skipToContent: "Перейти к содержимому",
    menuOpen: "Открыть меню",
    menuClose: "Закрыть меню",
    menu: "Меню",
    navPrimary: "Основное",
    navMobile: "Мобильная навигация",
    language: {
      label: "Язык",
      names: {
        en: "English",
        pt: "Português",
        ru: "Русский",
        es: "Español",
      },
    },
  },
  nav: {
    exploreRooms: "Комнаты",
    mySpace: "Моё пространство",
    mySpaceCreate: "Моё пространство / Создать комнату",
    createRoom: "Создать комнату",
    changeName: "Сменить имя",
    signingOut: "Выход…",
    guest: "Гость",
    sessionMenuAria: "Меню сессии",
    sessionMenuKicker: "Вы вошли как",
    sessionNameLabel: "Ваше имя",
    sessionNamePlaceholder: "Как вас показывать",
    sessionAvatarLabel: "Фото по ссылке (необяз.)",
    sessionAvatarPlaceholder: "https://…",
    sessionAvatarHint: "Публичная ссылка на изображение. Пусто — инициалы.",
    sessionSave: "Сохранить",
    sessionSaving: "Сохранение…",
  },
  footer: {
    aria: "Подвал",
    description: "Место, где можно делиться экраном и временем с близкими.",
    findGroup: "НАЙДИ СВОЮ ГРУППУ",
    yourSpace: "ТВОЁ ПРОСТРАНСТВО",
    createRoom: "Создать комнату",
    copyright: "© {{year}} V0x Live.",
    tagline: "Сделано, чтобы быть вместе.",
  },
  meta: {
    siteTitle: "V0x Live",
    htmlDescription:
      "Трансляция экрана, голоса и видео для группы в браузере. Публичные или приватные комнаты — без установки.",
    home: "Ваша группа на одной волне",
    dashboard: "Ваше пространство",
    rooms: "Публичные комнаты",
    notFound: "Страница не найдена",
  },
  landing: {
    hero: {
      sectionLabel: "Создайте или найдите комнату",
      kicker: "Групповой показ экрана",
      title: "Создайте или найдите <accent>комнату</accent>",
      lead:
        "Делитесь экраном, голосом и чатом с приглашёнными. Без установки — прямо в браузере.",
      publicRooms: "Публичные комнаты",
    },
    steps: {
      title: "От экрана к комнате за три шага",
      code: "VX · flow",
      pickName: {
        title: "Выберите имя комнаты",
        text: "Публичная — в списке. Приватная — код в ссылке только для своих.",
      },
      shareScreen: {
        title: "Поделитесь экраном",
        text: "Вкладка, окно или весь экран. Включайте камеру и микрофон, когда нужно группе.",
      },
      sendLink: {
        title: "Отправьте ссылку",
        text: "Участники заходят в браузере на ПК или телефоне — с аккаунтом или просто с именем.",
      },
    },
    highlights: {
      title: "Всё нужное в одной комнате",
      code: "RM · room",
      screenAudio: {
        title: "Экран и звук",
        text: "Показывайте экран. Включайте звук трансляции, если браузер позволяет.",
      },
      voiceChat: {
        title: "Голос и чат",
        text: "Микрофон, камера и чат в одной комнате — без переключения приложений.",
      },
      publicPrivate: {
        title: "Публичная или приватная",
        text: "Открытые комнаты в списке или закрытые с кодом и необязательным паролем.",
      },
    },
    about: {
      title: "Что такое V0x Live",
      text:
        "Место, где можно делиться экраном и проводить время с близкими. Выберите имя, отправьте ссылку и соберите группу в браузере. Экран, голос, видео и чат в одном месте.",
      cta: "Открыть панель",
    },
    faq: {
      title: "Частые вопросы",
      code: "FAQ",
      free: {
        q: "Это бесплатно?",
        a: "Да. Создавайте комнаты, общайтесь и делитесь экраном без оплаты. Аккаунт необязателен.",
      },
      install: {
        q: "Нужно что-то устанавливать?",
        a: "Нет. Работает в браузере. Можно войти гостем с именем или создать аккаунт.",
      },
      mobile: {
        q: "Работает на телефоне?",
        a: "Смотреть и писать в чате можно с телефона. Трансляция экрана удобнее с компьютера.",
      },
    },
  },
  createRoom: {
    label: "Новая комната",
    title: "Начните с имени",
    fieldLabel: "Имя комнаты",
    placeholder: "Напр.: киномарафон",
    submit: "Создать комнату",
    footGuest: "Без регистрации — только имя.",
    statusOnline: "Сервис доступен",
    statusOffline: "Сервис недоступен",
    statusChecking: "Проверка…",
  },
  notFound: {
    titleLine1: "Этот сигнал",
    titleLine2: "не дошёл.",
    body: "Страница не найдена. Адрес мог измениться или комната уже закрыта.",
    backHome: "На главную",
  },
  ...domainRu,
} satisfies TranslationResource;
