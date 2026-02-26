/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "#0077b6",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#f0f9ff",
                    foreground: "#0077b6",
                },
                medical: {
                    blue: "#0077b6",
                    light: "#e0f2fe",
                    gray: "#f8fafc",
                }
            },
            gridTemplateColumns: {
                '16': 'repeat(16, minmax(0, 1fr))',
            },
        },
    },
    plugins: [],
}
