module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Titillium Web", "sans-serif"],
      },
      colors: {
        FEF2F2: "#FEF2F2",
      },
      zIndex: {
        '-1': '-1', // Adiciona um valor de z-index negativo
      },
    },
  },
  plugins: [],
};
