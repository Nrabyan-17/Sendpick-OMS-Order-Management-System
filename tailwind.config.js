export default {
    darkMode: 'class',
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.vue",
        "./resources/**/*.jsx"
    ],
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'zoom-in': 'zoomIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                zoomIn: {
                    '0%': { 
                        opacity: '0',
                        transform: 'scale(0.95)',
                    },
                    '100%': { 
                        opacity: '1',
                        transform: 'scale(1)',
                    },
                },
                slideUp: {
                    '0%': { 
                        opacity: '0',
                        transform: 'translateY(10px)',
                    },
                    '100%': { 
                        opacity: '1',
                        transform: 'translateY(0)',
                    },
                },
            },
        },
    },
    plugins: [],
};
