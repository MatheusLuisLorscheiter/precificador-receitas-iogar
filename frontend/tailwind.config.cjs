module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ============================================================================
      // ANIMAÇÕES CUSTOMIZADAS PARA LOADING SCREEN
      // ============================================================================
      
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'loading-bar': 'loading-bar 2s ease-in-out infinite',
      },
      
      keyframes: {
        'loading-bar': {
          '0%': { 
            transform: 'translateX(-100%)',
            width: '50%'
          },
          '50%': { 
            transform: 'translateX(0)',
            width: '80%'
          },
          '100%': { 
            transform: 'translateX(100%)',
            width: '50%'
          },
        },
      },
    },
  },
  plugins: [],
}