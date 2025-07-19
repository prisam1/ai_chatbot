/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        border: "hsl(240, 5%, 84%)",
        ring: "hsl(215, 20%, 65%)",
      },
    },
  },
  plugins: [],
};
