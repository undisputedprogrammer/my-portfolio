const config = {
  theme: {
    extend: {
      colors: {
        base: "var(--background)",
        panel: "var(--panel)",
        accent: "var(--accent)",
        "accent-glow": "var(--accent-glow)",
        "accent-2": "var(--accent-2)",
        terminal: "var(--terminal-text)",
        ink: "var(--text)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        terminal: ["var(--font-ibm)", "monospace"],
      },
    },
  },
};

export default config;
