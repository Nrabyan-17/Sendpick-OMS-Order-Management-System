import React from 'react';
import ReactDOM from 'react-dom/client';
import LoginForm from './LoginForm';
import ForgotPasswordForm from './ForgotPasswordForm';

/**
 * Menentukan komponen form yang akan ditampilkan berdasarkan URL path.
 */
function getAuthContent() {
    const path = window.location.pathname;

    if (path === '/auth/forgot-password') {
        return <ForgotPasswordForm />;
    }

    // Default: Login form
    return <LoginForm />;
}

export default function Auth({ }) {
    return (
        <div className="login-container">
            {/* Left Panel - Decorative */}
            <div className="login-left-panel">
                {/* Background Pattern */}
                <div className="login-background-pattern">
                    <svg viewBox="0 0 800 600" className="login-pattern-svg">
                        {/* Curved Lines */}
                        {[...Array(12)].map((_, i) => (
                            <ellipse
                                key={i}
                                cx="400"
                                cy="700"
                                rx={200 + i * 60}
                                ry={200 + i * 60}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="1"
                            />
                        ))}
                    </svg>
                </div>

                {/* Content */}
                <div className="login-left-content">
                    {/* Logo Icon */}
                    <div className="login-logo-icon">
                        <svg viewBox="0 0 48 48" fill="currentColor" className="login-asterisk-icon">
                            <path d="M24 4v16M24 44V28M4 24h16M44 24H28M8.5 8.5l11.3 11.3M39.5 39.5L28.2 28.2M39.5 8.5L28.2 19.8M8.5 39.5l11.3-11.3"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                fill="none" />
                        </svg>
                    </div>

                    {/* Welcome Text */}
                    <div className="login-welcome-section">
                        <h1 className="login-hero-title">
                            Hello
                            <br />
                            Sendpick!
                            <span className="login-wave-emoji">👋</span>
                        </h1>
                        <p className="login-hero-subtitle">
                            Streamline your delivery operations with smart logistics management.
                            Track shipments, manage drivers, and optimize routes effortlessly!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="login-left-footer">
                    <p>© 2025 Sendpick. All rights reserved.</p>
                </div>
            </div>

            {/* Right Panel - Auth Form (dynamic) */}
            <div className="login-right-panel">
                <div className="login-form-container">
                    {/* Brand Header */}
                    <div className="login-brand-header">
                        <img
                            src="/assets/logo_sendpick.aea87447-400x150.png"
                            alt="Sendpick Logo"
                            className="login-brand-logo"
                        />
                    </div>

                    {getAuthContent()}
                </div>
            </div>

            {/* Styles */}
            <style>{`
                .login-container {
                    display: flex;
                    min-height: 100vh;
                    width: 100%;
                    background: #ffffff;
                }
                
                /* Left Panel Styles */
                .login-left-panel {
                    flex: 1;
                    background: linear-gradient(135deg, #3b5de7 0%, #2c45b8 50%, #1a2d8a 100%);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    padding: 48px;
                    min-height: 100vh;
                }
                
                .login-background-pattern {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                
                .login-pattern-svg {
                    width: 100%;
                    height: 100%;
                }
                
                .login-left-content {
                    position: relative;
                    z-index: 10;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .login-logo-icon {
                    width: 72px;
                    height: 72px;
                    color: #60a5fa;
                    margin-bottom: 48px;
                }
                
                .login-asterisk-icon {
                    width: 100%;
                    height: 100%;
                }
                
                .login-welcome-section {
                    max-width: 450px;
                }
                
                .login-hero-title {
                    font-size: 3.5rem;
                    font-weight: 700;
                    color: white;
                    line-height: 1.1;
                    margin-bottom: 24px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-wave-emoji {
                    display: inline-block;
                    margin-left: 12px;
                    animation: wave-animation 1.5s ease-in-out infinite;
                    transform-origin: 70% 70%;
                }
                
                @keyframes wave-animation {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    50% { transform: rotate(-10deg); }
                    75% { transform: rotate(20deg); }
                }
                
                .login-hero-subtitle {
                    font-size: 1.1rem;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.6;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-left-footer {
                    position: relative;
                    z-index: 10;
                    margin-top: auto;
                }
                
                .login-left-footer p {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.875rem;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                /* Right Panel Styles */
                .login-right-panel {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px;
                    background: #ffffff;
                }
                
                .login-form-container {
                    width: 100%;
                    max-width: 420px;
                }
                
                .login-brand-header {
                    margin-bottom: 48px;
                    text-align: left;
                }
                
                .login-brand-logo {
                    height: 48px;
                    width: auto;
                    object-fit: contain;
                }
                
                /* Responsive Styles */
                @media (max-width: 1024px) {
                    .login-left-panel {
                        display: none;
                    }
                    
                    .login-right-panel {
                        flex: 1;
                    }
                    
                    .login-brand-header {
                        text-align: center;
                    }
                }
                
                @media (max-width: 640px) {
                    .login-right-panel {
                        padding: 24px;
                    }
                    
                    .login-form-container {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}

const container = document.getElementById('auth');

if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<Auth />);
}