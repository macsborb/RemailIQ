/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/index.ejs",     // ← ajoute ceci
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["ProspectAI", "dark", "light", "synthwave"], // ← ton thème custom + les autres
  },
}
