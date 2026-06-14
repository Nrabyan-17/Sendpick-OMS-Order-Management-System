<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>SendPick OMS - Dashboard</title>
    <link rel="icon" type="image/png" href="{{ asset('assets/logo_sendpick_favicon_padded.png') }}">
    <script>
        // Prevent theme flash before React mounts
        try {
            const savedTheme = localStorage.getItem('theme') || 'system';
            const isDark = savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (e) {
            console.error('Theme initialisation failed:', e);
        }
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class='antialiased overflow-hidden'>
    <div id='dashboard'></div>
    
    <!-- Authentication Check -->
    <script>
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        if (!token) {
            // Redirect to login if no token found
            window.location.href = '/login';
        }
    </script>
</body>
</html>