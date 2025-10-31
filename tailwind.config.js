/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
         black: {
          DEFAULT: '#000000',
          100: '#8C8E98',
          200: '#666878',
          300: '#191d31',
    },
    gray: {
      DEFAULT: '#808191',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#D8D2C6'
    },
        danger: '#f75555'
  },
  plugins: [],
  },
}
    }