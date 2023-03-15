/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class', '[data-theme="dark"]'],
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          sans: "Inter, sans-serif",
          button: "Open Sans, sans-serif",
        },
        colors: {
          offWhite: "#F2F2F2",
          offBlack: "#16191D",
          lightBlack: "#23272E",
          midnight: "#000000",
          borderLight: "rgba(105, 105, 105, 25%)",
          borderDark: "rgba(39, 39, 39, 90%)",
        },
      },
    },
    plugins: [
      require("@tailwindcss/forms"),
      require("@tailwindcss/typography"),
      require("@tailwindcss/aspect-ratio"),
    ],
  };