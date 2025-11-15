import defaultTheme from 'tailwindcss/defaultTheme';

const color = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                lg: '2rem',
            },
        },
        extend: {
            colors: {
                transparent: 'transparent',
                current: 'currentColor',
                white: '#ffffff',
                black: '#000000',
                background: color('background'),
                foreground: color('foreground'),
                muted: color('muted'),
                card: color('card'),
                surface: color('surface'),
                border: color('border'),
                input: color('input'),
                primary: {
                    DEFAULT: color('primary'),
                    foreground: color('primary-foreground'),
                },
                secondary: color('secondary'),
                accent: color('accent'),
                success: color('success'),
                warning: color('warning'),
                danger: color('danger'),
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            boxShadow: {
                soft: '0 24px 60px -30px rgba(15, 15, 15, 0.4)',
                'soft-dark': '0 24px 60px -30px rgba(0, 0, 0, 0.75)',
            },
            borderRadius: {
                lg: '0.85rem',
                xl: '1.25rem',
                '2xl': '1.75rem',
                '3xl': '2.5rem',
            },
            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [],
};
