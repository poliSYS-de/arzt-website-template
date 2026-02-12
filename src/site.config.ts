export const siteConfig = {
  // Basis — HIER ANPASSEN
  name: "Dr. Mustermann",
  domain: "https://beispiel-arzt.de",
  language: "de",
  locale: "de_DE",

  // Inhaber — HIER ANPASSEN
  owner: {
    name: "Dr. med. Max Mustermann",
    role: "Facharzt für Allgemeinmedizin",
    location: "Berlin",
    email: "kontakt@beispiel-arzt.de",
    phone: "",
  },

  // Branding — HIER ANPASSEN
  branding: {
    tagline: "Facharzt für Allgemeinmedizin — Ganzheitlich. Individuell. Auf Augenhöhe.",
    logo: {
      type: "text" as const,
      value: "Dr. Mustermann",
      accentChar: ".",
    },
    colors: {
      accent: "#2B6CB0",
      accentDark: "#1E5090",
    },
  },

  // Navigation
  navigation: [
    { name: "Start", href: "/" },
    { name: "Über mich", href: "/ueber-mich" },
    { name: "Schwerpunkte", href: "/schwerpunkte" },
    { name: "Kontakt", href: "/kontakt", isCTA: true },
  ],

  // Footer
  footer: {
    description: "Facharzt für Allgemeinmedizin mit Schwerpunkt ganzheitliche Versorgung in Berlin.",
    links: [
      { name: "Start", href: "/" },
      { name: "Über mich", href: "/ueber-mich" },
      { name: "Schwerpunkte", href: "/schwerpunkte" },
      { name: "Kontakt", href: "/kontakt" },
    ],
    legal: [
      { name: "Impressum", href: "/impressum" },
      { name: "Datenschutz", href: "/datenschutz" },
    ],
  },

  // Social Links — HIER ANPASSEN (leere URLs werden ausgeblendet)
  social: [] as { platform: string; url: string; label: string }[],

  // SEO Cross-Links (arztbesuche.de Backlinks — IMMER dabei)
  crossLinks: {
    arztbesuche: {
      url: "https://arztbesuche.de/hausbesuch-arzt-berlin/",
      text: "Hausbesuche in Berlin",
    },
    profilUrl: "",
  },

  // SEO Defaults — HIER ANPASSEN
  seo: {
    defaultDescription: "Dr. med. Max Mustermann — Facharzt für Allgemeinmedizin in Berlin. Ganzheitliche Versorgung, Akupunktur und Schmerztherapie.",
    defaultOgImage: "/images/og-default.webp",
    author: "Dr. med. Max Mustermann",
    themeColor: "#2B6CB0",
  },

  // Features
  features: {
    blog: false,
    schwerpunkte: true,
  },
};
