import React, { createContext, useContext, useEffect, useState } from "react";

const LANGUAGE_STORAGE_KEY = "eduverse_language";

export const LANGUAGE_OPTIONS = [
  { code: "en", nativeLabel: "English" },
  { code: "it", nativeLabel: "Italiano" },
  { code: "ro", nativeLabel: "Română" },
  { code: "zh-TW", nativeLabel: "中文(繁體)" },
  { code: "ar", nativeLabel: "العربية" },
  { code: "ja", nativeLabel: "日本語" },
  { code: "ru", nativeLabel: "Русский" },
  { code: "de", nativeLabel: "Deutsch" },
  { code: "ko", nativeLabel: "한국어" },
  { code: "th", nativeLabel: "ภาษาไทย" },
  { code: "es", nativeLabel: "Español" },
  { code: "nl", nativeLabel: "Nederlands" },
  { code: "tr", nativeLabel: "Türkçe" },
  { code: "fr", nativeLabel: "Français" },
  { code: "pl", nativeLabel: "Polski" },
  { code: "vi", nativeLabel: "Tiếng Việt" },
  { code: "id", nativeLabel: "Bahasa Indonesia" },
  { code: "pt", nativeLabel: "Português" },
  { code: "zh-CN", nativeLabel: "中文(简体)" },
];

const EN_MESSAGES = {
  nav: {
    home: "Home",
    courses: "Courses",
    explore: "Explore",
    subscribe: "Subscribe",
    searchPlaceholder: "Search for anything",
    business: "EduVerse Business",
    teach: "Teach on EduVerse",
    myLearning: "My learning",
    wishlist: "Wishlist",
    cart: "Cart",
    notifications: "Notifications",
    loginSignup: "Login / Signup",
  },
  profile: {
    profile: "Profile",
    myLearning: "My learning",
    roadmaps: "Roadmaps",
    rooms: "Rooms",
    myCart: "My cart",
    wishlist: "Wishlist",
    referFriend: "Refer a friend",
    teach: "Teach on EduVerse",
    notifications: "Notifications",
    messages: "Messages",
    accountSettings: "Account settings",
    paymentMethods: "Payment methods",
    subscriptions: "Subscriptions",
    credits: "EduVerse credits",
    purchaseHistory: "Purchase history",
    language: "Language",
    publicProfile: "Public profile",
    signOut: "Sign out",
  },
  home: {
    welcomeBack: "Welcome back",
    role: "DevOps Engineer",
    editOccupation: "Edit occupation and interests",
    loadingCourses: "Loading your courses...",
    noEnrolledCourses: "You have not enrolled in any courses yet.",
    continueLearning: "Continue learning",
    goToMyLearning: "Go to My learning",
    myLearningTitle: "My learning",
  },
  language: {
    choose: "Choose a language",
    changed: "Language changed to {{language}}",
  },
};

const TRANSLATIONS = {
  en: EN_MESSAGES,
  es: {
    nav: {
      home: "Inicio",
      courses: "Cursos",
      explore: "Explorar",
      subscribe: "Suscribirse",
      searchPlaceholder: "Buscar cualquier cosa",
      teach: "Enseña en EduVerse",
      myLearning: "Mi aprendizaje",
      wishlist: "Lista de deseos",
      cart: "Carrito",
      notifications: "Notificaciones",
      loginSignup: "Iniciar sesión / Registro",
    },
    profile: {
      profile: "Perfil",
      myLearning: "Mi aprendizaje",
      roadmaps: "Rutas",
      rooms: "Salas",
      myCart: "Mi carrito",
      wishlist: "Lista de deseos",
      referFriend: "Invitar a un amigo",
      teach: "Enseña en EduVerse",
      notifications: "Notificaciones",
      messages: "Mensajes",
      accountSettings: "Configuración de la cuenta",
      paymentMethods: "Métodos de pago",
      subscriptions: "Suscripciones",
      credits: "Créditos EduVerse",
      purchaseHistory: "Historial de compras",
      language: "Idioma",
      publicProfile: "Perfil público",
      signOut: "Cerrar sesión",
    },
    home: {
      welcomeBack: "Bienvenido de nuevo",
      role: "Ingeniero DevOps",
      editOccupation: "Editar ocupación e intereses",
      loadingCourses: "Cargando tus cursos...",
      noEnrolledCourses: "Aún no te has inscrito en ningún curso.",
      continueLearning: "Seguir aprendiendo",
      goToMyLearning: "Ir a Mi aprendizaje",
      myLearningTitle: "Mi aprendizaje",
    },
    language: {
      choose: "Elige un idioma",
      changed: "Idioma cambiado a {{language}}",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      courses: "Cours",
      explore: "Explorer",
      subscribe: "S'abonner",
      searchPlaceholder: "Rechercher n'importe quoi",
      teach: "Enseigner sur EduVerse",
      myLearning: "Mon apprentissage",
      wishlist: "Liste de souhaits",
      cart: "Panier",
      notifications: "Notifications",
      loginSignup: "Connexion / Inscription",
    },
    profile: {
      profile: "Profil",
      myLearning: "Mon apprentissage",
      accountSettings: "Paramètres du compte",
      paymentMethods: "Moyens de paiement",
      subscriptions: "Abonnements",
      language: "Langue",
      signOut: "Se déconnecter",
    },
    home: {
      welcomeBack: "Bon retour",
      role: "Ingénieur DevOps",
      editOccupation: "Modifier le métier et les centres d'intérêt",
      loadingCourses: "Chargement de vos cours...",
      noEnrolledCourses: "Vous n'êtes inscrit à aucun cours pour le moment.",
      continueLearning: "Continuer l'apprentissage",
      goToMyLearning: "Aller à Mon apprentissage",
      myLearningTitle: "Mon apprentissage",
    },
    language: {
      choose: "Choisissez une langue",
      changed: "Langue changée en {{language}}",
    },
  },
  de: {
    nav: {
      home: "Startseite",
      courses: "Kurse",
      explore: "Entdecken",
      subscribe: "Abonnieren",
      searchPlaceholder: "Nach allem suchen",
      teach: "Auf EduVerse unterrichten",
      myLearning: "Mein Lernen",
      wishlist: "Wunschliste",
      cart: "Warenkorb",
      notifications: "Benachrichtigungen",
      loginSignup: "Anmelden / Registrieren",
    },
    profile: {
      profile: "Profil",
      myLearning: "Mein Lernen",
      accountSettings: "Kontoeinstellungen",
      paymentMethods: "Zahlungsmethoden",
      subscriptions: "Abonnements",
      language: "Sprache",
      signOut: "Abmelden",
    },
    home: {
      welcomeBack: "Willkommen zurück",
      role: "DevOps-Ingenieur",
      editOccupation: "Beruf und Interessen bearbeiten",
      loadingCourses: "Deine Kurse werden geladen...",
      noEnrolledCourses: "Du bist noch in keinem Kurs eingeschrieben.",
      continueLearning: "Weiterlernen",
      goToMyLearning: "Zu Mein Lernen",
      myLearningTitle: "Mein Lernen",
    },
    language: {
      choose: "Sprache wählen",
      changed: "Sprache wurde auf {{language}} geändert",
    },
  },
  it: {
    nav: {
      courses: "Corsi",
      explore: "Esplora",
      subscribe: "Abbonati",
      searchPlaceholder: "Cerca qualsiasi cosa",
      teach: "Insegna su EduVerse",
      myLearning: "Il mio apprendimento",
      wishlist: "Lista dei desideri",
      cart: "Carrello",
      notifications: "Notifiche",
      loginSignup: "Accedi / Registrati",
    },
    profile: {
      profile: "Profilo",
      myLearning: "Il mio apprendimento",
      accountSettings: "Impostazioni account",
      paymentMethods: "Metodi di pagamento",
      subscriptions: "Abbonamenti",
      language: "Lingua",
      signOut: "Esci",
    },
    home: {
      welcomeBack: "Bentornato",
      role: "Ingegnere DevOps",
      editOccupation: "Modifica occupazione e interessi",
      loadingCourses: "Caricamento dei tuoi corsi...",
      noEnrolledCourses: "Non hai ancora corsi iscritti.",
      continueLearning: "Continua a imparare",
      goToMyLearning: "Vai a Il mio apprendimento",
      myLearningTitle: "Il mio apprendimento",
    },
    language: {
      choose: "Scegli una lingua",
      changed: "Lingua cambiata in {{language}}",
    },
  },
  pt: {
    nav: {
      home: "Início",
      courses: "Cursos",
      explore: "Explorar",
      subscribe: "Assinar",
      searchPlaceholder: "Pesquisar qualquer coisa",
      teach: "Ensine na EduVerse",
      myLearning: "Meu aprendizado",
      wishlist: "Lista de desejos",
      cart: "Carrinho",
      notifications: "Notificações",
      loginSignup: "Entrar / Cadastrar",
    },
    profile: {
      profile: "Perfil",
      myLearning: "Meu aprendizado",
      accountSettings: "Configurações da conta",
      paymentMethods: "Métodos de pagamento",
      subscriptions: "Assinaturas",
      language: "Idioma",
      signOut: "Sair",
    },
    home: {
      welcomeBack: "Bem-vindo de volta",
      role: "Engenheiro DevOps",
      editOccupation: "Editar ocupação e interesses",
      loadingCourses: "Carregando seus cursos...",
      noEnrolledCourses: "Você ainda não está inscrito em nenhum curso.",
      continueLearning: "Continuar aprendendo",
      goToMyLearning: "Ir para Meu aprendizado",
      myLearningTitle: "Meu aprendizado",
    },
    language: {
      choose: "Escolha um idioma",
      changed: "Idioma alterado para {{language}}",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      courses: "コース",
      explore: "探索",
      subscribe: "購読",
      searchPlaceholder: "何でも検索",
      teach: "EduVerseで教える",
      myLearning: "マイラーニング",
      wishlist: "ほしい物リスト",
      cart: "カート",
      notifications: "通知",
      loginSignup: "ログイン / 登録",
    },
    profile: {
      profile: "プロフィール",
      myLearning: "マイラーニング",
      accountSettings: "アカウント設定",
      paymentMethods: "支払い方法",
      subscriptions: "サブスクリプション",
      language: "言語",
      signOut: "サインアウト",
    },
    home: {
      welcomeBack: "おかえりなさい",
      role: "DevOpsエンジニア",
      editOccupation: "職業と興味を編集",
      loadingCourses: "コースを読み込み中...",
      noEnrolledCourses: "まだ受講中のコースはありません。",
      continueLearning: "学習を続ける",
      goToMyLearning: "マイラーニングへ",
      myLearningTitle: "マイラーニング",
    },
    language: {
      choose: "言語を選択",
      changed: "言語を {{language}} に変更しました",
    },
  },
  "zh-CN": {
    nav: {
      home: "首页",
      courses: "课程",
      explore: "探索",
      subscribe: "订阅",
      searchPlaceholder: "搜索任何内容",
      teach: "在 EduVerse 授课",
      myLearning: "我的学习",
      wishlist: "心愿单",
      cart: "购物车",
      notifications: "通知",
      loginSignup: "登录 / 注册",
    },
    profile: {
      profile: "个人资料",
      myLearning: "我的学习",
      accountSettings: "账户设置",
      paymentMethods: "支付方式",
      subscriptions: "订阅",
      language: "语言",
      signOut: "退出登录",
    },
    home: {
      welcomeBack: "欢迎回来",
      role: "DevOps 工程师",
      editOccupation: "编辑职业和兴趣",
      loadingCourses: "正在加载你的课程...",
      noEnrolledCourses: "你还没有报名任何课程。",
      continueLearning: "继续学习",
      goToMyLearning: "前往我的学习",
      myLearningTitle: "我的学习",
    },
    language: {
      choose: "选择语言",
      changed: "语言已更改为 {{language}}",
    },
  },
};

const LanguageContext = createContext(null);

const getValueAtPath = (source, path) =>
  path.split(".").reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), source);

const interpolate = (template, values = {}) =>
  String(template).replace(/\{\{(.*?)\}\}/g, (_, token) => values[token.trim()] ?? "");

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && LANGUAGE_OPTIONS.some((option) => option.code === stored)) {
    return stored;
  }
  return "en";
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage) => {
    if (!LANGUAGE_OPTIONS.some((option) => option.code === nextLanguage)) {
      return;
    }

    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    setLanguageState(nextLanguage);
  };

  const getLanguageNativeLabel = (code = language) =>
    LANGUAGE_OPTIONS.find((option) => option.code === code)?.nativeLabel ?? "English";

  const t = (key, values) => {
    const localized = getValueAtPath(TRANSLATIONS[language], key);
    const fallback = getValueAtPath(EN_MESSAGES, key) ?? key;
    return interpolate(localized ?? fallback, values);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languageOptions: LANGUAGE_OPTIONS,
        getLanguageNativeLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used within LanguageProvider");
  }
  return context;
};
