import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Базовая палитра «Личный ритм» — мягкая, светлая, премиальная
        bg: "#FAF7F2", // тёплый кремовый фон приложения
        surface: "#F3EEE7", // фон вокруг контейнера на десктопе
        card: "#FFFFFF",
        milk: "#FFFDFB", // молочные карточки
        ink: "#2F2F35", // основной графитовый текст
        muted: "#7C7A88", // вторичный серо-лиловый текст
        faint: "#A8A6B2", // совсем приглушённый текст / иконки
        accent: "#8B5CF6", // мягкий фиолетовый акцент
        "accent-soft": "#EFEAFE", // фиолетовая подложка (tinted)
        green: "#A7D8A0", // success
        "green-soft": "#E8F4E6",
        peach: "#F29B8F", // warning / расходы (мягкий коралл)
        "peach-soft": "#FCEAE6",
        sky: "#9CC3E6", // спокойный голубой (сбережения / «вода»)
        "sky-soft": "#E6F0F9",
        honey: "#E6C079", // тёплый медовый акцент
        "honey-soft": "#FBF1DA",
        line: "#EDE7DF", // очень светлая тёплая граница
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(47, 47, 53, 0.08)",
        card: "0 14px 38px -22px rgba(47, 47, 53, 0.22)",
        nav: "0 18px 46px -24px rgba(47, 47, 53, 0.5)",
        "accent-glow": "0 16px 34px -18px rgba(139, 92, 246, 0.55)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
