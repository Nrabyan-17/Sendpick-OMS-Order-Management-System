<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>SendPick OMS - Dashboard</title>
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