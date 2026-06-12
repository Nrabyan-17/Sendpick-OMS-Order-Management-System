import { useState } from 'react';
import { ArrowLeft, Mail, Eye, EyeOff, CheckCircle, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';

export default function ForgotPasswordForm() {
    // Step: 1 = email input, 2 = password input, 3 = success
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [adminName, setAdminName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dataForm, setDataForm] = useState({
        password: '',
        password_confirmation: '',
    });

    // Step 1: Verify email
    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/auth/verify-email', { email });

            if (response.data.success) {
                setAdminName(response.data.data.name);
                setStep(2);
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.errors?.email) {
                setError(err.response.data.errors.email[0]);
            } else {
                setError('Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (dataForm.password.length < 8) {
            setError('Password minimal 8 karakter.');
            setIsLoading(false);
            return;
        }

        if (dataForm.password !== dataForm.password_confirmation) {
            setError('Konfirmasi password tidak cocok.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('/auth/reset-password', {
                email: email,
                password: dataForm.password,
                password_confirmation: dataForm.password_confirmation,
            });

            if (response.data.success) {
                setStep(3);
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const firstError = Object.values(errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError('Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength
    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, label: '', color: '' };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, label: 'Lemah', color: '#ef4444' };
        if (score <= 2) return { level: 2, label: 'Cukup', color: '#f59e0b' };
        if (score <= 3) return { level: 3, label: 'Baik', color: '#3b82f6' };
        return { level: 4, label: 'Kuat', color: '#16a34a' };
    };

    const strength = getPasswordStrength(dataForm.password);

    return (
        <>
            {/* Back to Login */}
            <a href="/login" className="fp-back-link">
                <ArrowLeft className="fp-back-icon" />
                <span>Kembali ke Login</span>
            </a>

            {/* Step Indicator */}
            {step < 3 && (
                <div className="fp-steps">
                    <div className={`fp-step ${step >= 1 ? 'fp-step-active' : ''}`}>
                        <div className="fp-step-dot">1</div>
                        <span>Verifikasi Email</span>
                    </div>
                    <div className="fp-step-line"></div>
                    <div className={`fp-step ${step >= 2 ? 'fp-step-active' : ''}`}>
                        <div className="fp-step-dot">2</div>
                        <span>Password Baru</span>
                    </div>
                </div>
            )}

            {/* ======== STEP 1: Email Verification ======== */}
            {step === 1 && (
                <>
                    <div className="fp-header">
                        <div className="fp-icon-wrapper">
                            <Mail className="fp-mail-icon" />
                        </div>
                        <h2 className="fp-title">Forgot Password?</h2>
                        <p className="fp-subtitle">
                            Masukkan email akun Anda untuk memulai proses reset password.
                        </p>
                    </div>

                    {error && (
                        <div className="fp-error-alert">
                            <svg className="fp-error-svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="fp-form" onSubmit={handleVerifyEmail}>
                        <div className="fp-field">
                            <label htmlFor="fp-email" className="fp-label">Email Address</label>
                            <input
                                id="fp-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="fp-input"
                                placeholder="your@email.com"
                                autoFocus
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="fp-submit-button">
                            {isLoading ? (
                                <span className="fp-loading">
                                    <svg className="fp-spinner" viewBox="0 0 24 24">
                                        <circle className="fp-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                                    </svg>
                                    Memverifikasi...
                                </span>
                            ) : (
                                'Lanjutkan'
                            )}
                        </button>
                    </form>
                </>
            )}

            {/* ======== STEP 2: New Password ======== */}
            {step === 2 && (
                <>
                    <div className="fp-header">
                        <div className="fp-icon-wrapper fp-icon-wrapper-amber">
                            <ShieldCheck className="fp-shield-icon" />
                        </div>
                        <h2 className="fp-title">Buat Password Baru</h2>
                        <div className="fp-user-badge">
                            <User className="fp-user-badge-icon" />
                            <span>{adminName}</span>
                            <span className="fp-user-badge-email">({email})</span>
                        </div>
                    </div>

                    {error && (
                        <div className="fp-error-alert">
                            <svg className="fp-error-svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="fp-form" onSubmit={handleResetPassword}>
                        {/* Password Baru */}
                        <div className="fp-field">
                            <label htmlFor="fp-password" className="fp-label">Password Baru</label>
                            <div className="fp-password-wrapper">
                                <input
                                    id="fp-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={dataForm.password}
                                    onChange={(e) => setDataForm({ ...dataForm, password: e.target.value })}
                                    className="fp-input"
                                    placeholder="Minimal 8 karakter"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="fp-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="fp-eye-icon" /> : <Eye className="fp-eye-icon" />}
                                </button>
                            </div>

                            {dataForm.password && (
                                <div className="fp-strength">
                                    <div className="fp-strength-bar">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className="fp-strength-segment"
                                                style={{ background: level <= strength.level ? strength.color : '#e5e7eb' }}
                                            />
                                        ))}
                                    </div>
                                    <span className="fp-strength-label" style={{ color: strength.color }}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="fp-field">
                            <label htmlFor="fp-password-confirm" className="fp-label">Konfirmasi Password</label>
                            <div className="fp-password-wrapper">
                                <input
                                    id="fp-password-confirm"
                                    name="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={dataForm.password_confirmation}
                                    onChange={(e) => setDataForm({ ...dataForm, password_confirmation: e.target.value })}
                                    className="fp-input"
                                    placeholder="Ulangi password baru"
                                />
                                <button
                                    type="button"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    className="fp-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="fp-eye-icon" /> : <Eye className="fp-eye-icon" />}
                                </button>
                            </div>

                            {dataForm.password_confirmation && (
                                <div className="fp-match-indicator">
                                    {dataForm.password === dataForm.password_confirmation ? (
                                        <span className="fp-match-success">
                                            <CheckCircle className="fp-match-icon" />
                                            Password cocok
                                        </span>
                                    ) : (
                                        <span className="fp-match-error">Password tidak cocok</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="fp-button-group">
                            <button
                                type="button"
                                className="fp-back-button"
                                onClick={() => { setStep(1); setError(''); setDataForm({ password: '', password_confirmation: '' }); }}
                            >
                                Kembali
                            </button>
                            <button type="submit" disabled={isLoading} className="fp-submit-button fp-submit-flex">
                                {isLoading ? (
                                    <span className="fp-loading">
                                        <svg className="fp-spinner" viewBox="0 0 24 24">
                                            <circle className="fp-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                                        </svg>
                                        Mereset...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}

            {/* ======== STEP 3: Success ======== */}
            {step === 3 && (
                <div className="fp-success-card">
                    <div className="fp-success-icon-wrapper">
                        <ShieldCheck className="fp-success-shield-icon" />
                    </div>
                    <h3 className="fp-success-title">Password Berhasil Direset!</h3>
                    <p className="fp-success-text">
                        Password untuk <strong>{email}</strong> telah berhasil diperbarui.
                        Anda akan dialihkan ke halaman login...
                    </p>
                    <div className="fp-redirect-bar">
                        <div className="fp-redirect-progress"></div>
                    </div>
                    <a href="/login" className="fp-login-link">Login Sekarang</a>
                </div>
            )}

            {/* Styles */}
            <style>{`
                .fp-back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #666666;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    margin-bottom: 24px;
                    transition: color 0.2s ease;
                }
                .fp-back-link:hover { color: #3b5de7; }
                .fp-back-icon { width: 16px; height: 16px; }

                /* Step Indicator */
                .fp-steps {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                    padding: 14px 18px;
                    background: #f9fafb;
                    border-radius: 10px;
                }
                .fp-step {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: #9ca3af;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    transition: color 0.3s ease;
                }
                .fp-step-active { color: #3b5de7; font-weight: 500; }
                .fp-step-dot {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #9ca3af;
                    transition: all 0.3s ease;
                }
                .fp-step-active .fp-step-dot {
                    background: #3b5de7;
                    color: white;
                }
                .fp-step-line {
                    flex: 1;
                    height: 2px;
                    background: #e5e7eb;
                    border-radius: 1px;
                }

                /* Header */
                .fp-header { margin-bottom: 24px; }
                .fp-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 18px;
                }
                .fp-icon-wrapper-amber {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                }
                .fp-mail-icon { width: 26px; height: 26px; color: #3b5de7; }
                .fp-shield-icon { width: 26px; height: 26px; color: #d97706; }
                .fp-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 8px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                .fp-subtitle {
                    font-size: 0.875rem;
                    color: #666666;
                    line-height: 1.6;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }

                /* User Badge (Step 2) */
                .fp-user-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #166534;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    margin-top: 8px;
                }
                .fp-user-badge-icon { width: 16px; height: 16px; }
                .fp-user-badge-email {
                    color: #4ade80;
                    font-weight: 400;
                    font-size: 0.8rem;
                }

                /* Error */
                .fp-error-alert {
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
                    animation: fpSlideDown 0.3s ease-out;
                }
                .fp-error-svg { width: 20px; height: 20px; flex-shrink: 0; }

                @keyframes fpSlideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Form */
                .fp-form { display: flex; flex-direction: column; gap: 18px; }
                .fp-field { display: flex; flex-direction: column; gap: 8px; }
                .fp-label {
                    font-size: 0.875rem;
                    color: #666666;
                    font-weight: 400;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                .fp-input {
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
                .fp-input::placeholder { color: #999999; }
                .fp-input:focus {
                    outline: none;
                    border-color: #3b5de7;
                    box-shadow: 0 0 0 3px rgba(59, 93, 231, 0.1);
                }

                /* Password */
                .fp-password-wrapper { position: relative; }
                .fp-password-wrapper .fp-input { padding-right: 48px; }
                .fp-password-toggle {
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
                .fp-eye-icon { width: 20px; height: 20px; color: #999; transition: color 0.2s; }
                .fp-password-toggle:hover .fp-eye-icon { color: #666; }

                /* Strength */
                .fp-strength { display: flex; align-items: center; gap: 10px; }
                .fp-strength-bar { display: flex; gap: 4px; flex: 1; }
                .fp-strength-segment {
                    height: 4px;
                    flex: 1;
                    border-radius: 2px;
                    transition: background 0.3s ease;
                }
                .fp-strength-label {
                    font-size: 0.75rem;
                    font-weight: 500;
                    min-width: 45px;
                    text-align: right;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }

                /* Match */
                .fp-match-indicator { font-size: 0.8rem; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
                .fp-match-success { color: #16a34a; display: flex; align-items: center; gap: 4px; }
                .fp-match-icon { width: 14px; height: 14px; }
                .fp-match-error { color: #ef4444; }

                /* Buttons */
                .fp-submit-button {
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
                    margin-top: 4px;
                }
                .fp-submit-button:hover:not(:disabled) {
                    background: #333333;
                    transform: translateY(-1px);
                }
                .fp-submit-button:disabled { opacity: 0.7; cursor: not-allowed; }
                .fp-submit-flex { flex: 1; margin-top: 0; }

                .fp-button-group {
                    display: flex;
                    gap: 12px;
                    margin-top: 4px;
                }
                .fp-back-button {
                    padding: 14px 20px;
                    background: white;
                    color: #666;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                    white-space: nowrap;
                }
                .fp-back-button:hover {
                    background: #f9fafb;
                    border-color: #d0d0d0;
                }

                .fp-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
                .fp-spinner { width: 20px; height: 20px; animation: fpSpin 1s linear infinite; }
                .fp-spinner-circle { stroke-dasharray: 60; stroke-dashoffset: 45; }
                @keyframes fpSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Success */
                .fp-success-card {
                    text-align: center;
                    padding: 32px 20px;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
                    border: 1px solid #bbf7d0;
                    border-radius: 12px;
                    animation: fpSlideDown 0.4s ease-out;
                }
                .fp-success-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    background: #dcfce7;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px auto;
                }
                .fp-success-shield-icon { width: 32px; height: 32px; color: #16a34a; }
                .fp-success-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #15803d;
                    margin-bottom: 12px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                .fp-success-text {
                    font-size: 0.875rem;
                    color: #166534;
                    line-height: 1.6;
                    margin-bottom: 16px;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                .fp-redirect-bar {
                    width: 200px;
                    height: 4px;
                    background: #bbf7d0;
                    border-radius: 2px;
                    margin: 0 auto 20px auto;
                    overflow: hidden;
                }
                .fp-redirect-progress {
                    height: 100%;
                    background: #16a34a;
                    border-radius: 2px;
                    animation: fpProgress 3s linear forwards;
                }
                @keyframes fpProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .fp-login-link {
                    display: inline-block;
                    padding: 10px 28px;
                    background: #1a1a1a;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                }
                .fp-login-link:hover {
                    background: #333333;
                    transform: translateY(-1px);
                }
            `}</style>
        </>
    );
}
