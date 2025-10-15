/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mastergoal palette
        'mg-brown': '#1C0F01',
        'mg-green-1': '#255935',
        'mg-green-2': '#48763B',
        'mg-green-3': '#436836',
        'mg-sage': '#A4A77E',
        'mg-sand': '#E6DCB7',
        'mg-cream': '#F5EFD5', 
        'mg-blue': '#202C59',
        'mg-orange': '#F18F01',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}
