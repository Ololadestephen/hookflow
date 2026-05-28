import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "outline-variant": "#3c4a42",
        "on-error-container": "#ffdad6",
        "surface-tint": "#4edea3",
        "on-secondary-fixed": "#002019",
        "on-surface-variant": "#bbcabf",
        "surface-bright": "#2d3c37",
        primary: "#4edea3",
        "on-primary": "#003824",
        outline: "#86948a",
        "surface-container-lowest": "#04110d",
        "on-background": "#d5e6df",
        "error-container": "#93000a",
        "surface-dim": "#081612",
        "inverse-primary": "#006c49",
        "on-secondary-container": "#9ac0b3",
        "tertiary-fixed": "#cce9de",
        "on-tertiary-fixed-variant": "#324c44",
        background: "#081612",
        "surface-container": "#14221e",
        "on-secondary": "#12362d",
        "on-tertiary": "#1b352e",
        "on-primary-fixed-variant": "#005236",
        "primary-fixed": "#6ffbbe",
        "secondary-container": "#2c5045",
        "on-surface": "#d5e6df",
        "inverse-surface": "#d5e6df",
        "on-error": "#690005",
        "on-primary-container": "#00422b",
        "on-primary-fixed": "#002113",
        "primary-fixed-dim": "#4edea3",
        "on-secondary-fixed-variant": "#2a4d43",
        "on-tertiary-fixed": "#05201a",
        "surface-container-high": "#1e2d28",
        "secondary-fixed": "#c4ebdd",
        "surface-variant": "#293833",
        "tertiary-fixed-dim": "#b0cdc3",
        secondary: "#a8cfc1",
        "tertiary-container": "#8da9a0",
        "primary-container": "#10b981",
        tertiary: "#b0cdc3",
        "surface-container-highest": "#293833",
        "secondary-fixed-dim": "#a8cfc1",
        "on-tertiary-container": "#243e37",
        error: "#ffb4ab",
        "surface-container-low": "#101e1a",
        surface: "#081612",
        "inverse-on-surface": "#25332e",
        ink: "#081612",
        mantle: "#101e1a",
        panel: "#14221e",
        panel2: "#1e2d28",
        line: "#3c4a42",
        text: "#d5e6df",
        muted: "#9ac0b3",
        mint: "#4edea3",
        mint2: "#6ffbbe",
        sage: "#b0cdc3"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Newsreader", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        "label-md": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "mono-data": ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        "display-lg": ["Newsreader", "Georgia", "serif"],
        "body-md": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-md": ["Newsreader", "Georgia", "serif"],
        "headline-lg-mobile": ["Newsreader", "Georgia", "serif"],
        "body-lg": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "headline-lg": ["Newsreader", "Georgia", "serif"]
      },
      fontSize: {
        "label-md": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "mono-data": ["13px", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "500" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
        "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "500" }]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        unit: "4px",
        gutter: "16px",
        "margin-mobile": "16px",
        "margin-desktop": "32px",
        "container-max": "1440px"
      },
      boxShadow: {
        glow: "0 0 32px rgba(78, 222, 163, 0.12)",
        panel: "0 24px 70px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
