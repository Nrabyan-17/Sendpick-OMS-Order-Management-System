import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [dataForm, setDataForm] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Hit API Login
            const response = await axios.post('/auth/login', {
                email: dataForm.email,
                password: dataForm.password,
                type: 'admin' // Login sebagai admin (bukan driver)
            });

            if (response.data.success) {
                // Clear old localStorage keys (if any)
                localStorage.removeItem('sendpick_user');

                // Simpan token dan user data ke localStorage
                localStorage.setItem('auth_token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
                localStorage.setItem('user_type', response.data.data.user_type);

                // Set default axios header untuk request selanjutnya
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;

                // Redirect ke dashboard
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error('Login error:', err);

            // Handle error response
            if (err.response?.data?.errors?.email) {
                setError(err.response.data.errors.email[0]);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Welcome Back Section */}
            <div className="login-welcome-back">
                <h2 className="login-form-title">Welcome Back!</h2>
                <p className="login-form-subtitle">
                    Please enter your credentials to access your account.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="login-error-alert">
                    <svg className="login-error-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="login-field">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={dataForm.email}
                        onChange={(e) =>
                            setDataForm({ ...dataForm, email: e.target.value })
                        }
                        className="login-input"
                        placeholder="your@email.com"
                    />
                </div>

                {/* Password Field */}
                <div className="login-field">
                    <label htmlFor="password" className="login-label">
                        Password
                    </label>
                    <div className="login-password-wrapper">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={dataForm.password}
                            onChange={(e) =>
                                setDataForm({ ...dataForm, password: e.target.value })
                            }
                            className="login-input"
                            placeholder="Enter your password"
                        />
                        <button
                            type="button"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                            className="login-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="login-eye-icon" />
                            ) : (
                                <Eye className="login-eye-icon" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Login Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="login-submit-button"
                >
                    {isLoading ? (
                        <span className="login-loading">
                            <svg className="login-spinner" viewBox="0 0 24 24">
                                <circle
                                    className="login-spinner-circle"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                />
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        'Login Now'
                    )}
                </button>

                {/* Forgot Password Link */}
                <div className="login-forgot-password">
                    <span className="login-forgot-text">Forget password</span>
                    <a href="/auth/forgot-password" className="login-forgot-link">
                        Click here
                    </a>
                </div>
            </form>

            {/* Styles */}
            <style>{`
                .login-welcome-back {
                    margin-bottom: 32px;
                }
                
                .login-form-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 8px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-form-subtitle {
                    font-size: 0.875rem;
                    color: #666666;
                    line-height: 1.5;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-link {
                    color: #1a1a1a;
                    text-decoration: underline;
                    font-weight: 500;
                    transition: color 0.2s ease;
                }
                
                .login-link:hover {
                    color: #3b5de7;
                }
                
                .login-error-alert {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #fee2e2;
                    border: 1px solid #fca5a5;
                    border-radius: 8px;
                    color: #991b1b;
                    font-size: 0.875rem;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    margin-bottom: 20px;
                    animation: slideDown 0.3s ease-out;
                }
                
                .login-error-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .login-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .login-label {
                    font-size: 0.875rem;
                    color: #666666;
                    font-weight: 400;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    font-size: 0.95rem;
                    color: #1a1a1a;
                    background: #fff;
                    transition: all 0.2s ease;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                
                .login-input::placeholder {
                    color: #999999;
                }
                
                .login-input:focus {
                    outline: none;
                    border-color: #3b5de7;
                    box-shadow: 0 0 0 3px rgba(59, 93, 231, 0.1);
                }
                
                .login-password-wrapper {
                    position: relative;
                }
                
                .login-password-wrapper .login-input {
                    padding-right: 48px;
                }
                
                .login-password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .login-eye-icon {
                    width: 20px;
                    height: 20px;
                    color: #999999;
                    transition: color 0.2s ease;
                }
                
                .login-password-toggle:hover .login-eye-icon {
                    color: #666666;
                }
                
                .login-submit-button {
                    width: 100%;
                    padding: 14px 24px;
                    background: #1a1a1a;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    margin-top: 8px;
                }
                
                .login-submit-button:hover:not(:disabled) {
                    background: #333333;
                    transform: translateY(-1px);
                }
                
                .login-submit-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .login-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .login-spinner {
                    width: 20px;
                    height: 20px;
                    animation: spin 1s linear infinite;
                }
                
                .login-spinner-circle {
                    stroke-dasharray: 60;
                    stroke-dashoffset: 45;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .login-google-button {
                    width: 100%;
                    padding: 12px 24px;
                    background: white;
                    color: #444444;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .login-google-button:hover:not(:disabled) {
                    background: #f9f9f9;
                    border-color: #d0d0d0;
                }
                
                .login-google-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .login-google-icon {
                    width: 20px;
                    height: 20px;
                }
                
                .login-forgot-password {
                    text-align: center;
                    font-size: 0.875rem;
                    color: #666666;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    margin-top: 8px;
                }
                
                .login-forgot-text {
                    margin-right: 4px;
                }
                
                .login-forgot-link {
                    color: #1a1a1a;
                    text-decoration: underline;
                    font-weight: 500;
                    transition: color 0.2s ease;
                }
                
                .login-forgot-link:hover {
                    color: #3b5de7;
                }
            `}</style>
        </>
    );
}