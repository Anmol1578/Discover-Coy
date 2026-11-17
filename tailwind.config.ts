import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0F",
        surface: {
          DEFAULT: "#18181B",
          hover: "#222226",
        },
        border: {
          subtle: "#27272A",
        },
        accent: {
          DEFAULT: "#F43F5E",
          hover: "#E11D48",
          muted: "rgba(244, 63, 94, 0.15)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
