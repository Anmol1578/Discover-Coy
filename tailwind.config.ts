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
        coy: {
          bg: "#FFFFFF",
          soft: "#F6F4FA",
          line: "#ECE9F2",
          rule: "#DDD8E8",
          text: "#15121D",
          muted: "#6D6979",
          pink: "#FF3D81",
          pinkStrong: "#D81E63",
          pinkSoft: "#FFE4EF",
          yellow: "#FFE45C",
          lilac: "#E7E0FF",
          mint: "#CBF4E0",
          sky: "#D7ECFF",
          peach: "#FFE1CF",
          whatsapp: "#25D366",
          ok: "#0E8F48",
          onDark: "#D9D5E2",
        },
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        coy: "4px 4px 0 #15121D",
        "coy-sm": "2.5px 2.5px 0 #15121D",
        "coy-lg": "6px 6px 0 #15121D",
        "coy-xl": "8px 8px 0 #15121D",
        "coy-active": "1px 1px 0 #15121D",
      },
      borderWidth: {
        coy: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
