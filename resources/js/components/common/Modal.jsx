import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Save current scroll position
window.addEventListener('scroll', () => {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
});

const Modal = ({ 
    isOpen, 
    onClose, 
    children, 
    title = '', 
    size = 'md', 
    showCloseButton = true,
    closeOnBackdropClick = true,
    backdropOpacity = 'default', // 'light', 'default', 'dark'
    disableScroll = true,
    hideContentScrollbar = false
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            console.log('🟢 Opening modal - Starting animation');
            setShouldRender(true);
            // Trigger animation after render
            setTimeout(() => {
                console.log('🟢 Setting isAnimating to TRUE');
                setIsAnimating(true);
            }, 10);
        } else if (shouldRender) {
            console.log('🔴 Closing modal - Starting exit animation');
            setIsAnimating(false);
            // Remove from DOM after animation completes
            const timer = setTimeout(() => {
                console.log('🔴 Removing modal from DOM');
                setShouldRender(false);
            }, 350); // Increased from 300ms to ensure animation completes
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    // Handle escape key press and body scroll
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            if (disableScroll) {
                const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
                const body = document.body;
                body.style.position = 'fixed';
                body.style.top = `-${scrollY}`;
                body.style.left = '0';
                body.style.right = '0';
                body.style.width = '100%';
                body.style.overflow = 'hidden';
            }
            
            return () => {
                document.removeEventListener('keydown', handleEscape);
                if (disableScroll) {
                    const body = document.body;
                    const scrollY = body.style.top;
                    body.style.position = '';
                    body.style.top = '';
                    body.style.left = '';
                    body.style.right = '';
                    body.style.width = '';
                    body.style.overflow = '';
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
            };
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    // Size configurations
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    // Backdrop opacity configurations
    const backdropClasses = {
        light: 'bg-gradient-to-br from-slate-900/5 via-slate-900/10 to-slate-900/5 backdrop-blur-sm',
        default: 'bg-gradient-to-br from-slate-900/10 via-slate-900/20 to-slate-900/10 backdrop-blur-sm',
        dark: 'bg-gradient-to-br from-slate-900/30 via-slate-900/50 to-slate-900/30 backdrop-blur-md'
    };

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    };

    const modalContent = (
        <div 
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '15px',
                overflowY: 'auto',
                backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                transition: 'background-color 0.35s ease-in-out'
            }}
            onClick={handleBackdropClick}
        >
            {/* Modal content dengan animasi smooth */}
            <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '680px',
                    maxHeight: '80vh',
                    margin: 'auto',
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    zIndex: 1000000,
                    opacity: isAnimating ? 1 : 0,
                    transform: isAnimating ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                    transition: isAnimating 
                        ? 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' // Opening: bouncy
                        : 'all 0.35s cubic-bezier(0.4, 0, 0.6, 1)' // Closing: smooth ease-out
                }}
            >
                {/* Header - SIMPLIFIED */}
                {(title || showCloseButton) && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        {title && (
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1f2937',
                                margin: 0
                            }}>
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#fee2e2';
                                    e.target.style.borderColor = '#ef4444';
                                    e.target.style.color = '#dc2626';
                                    e.target.style.transform = 'rotate(90deg) scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.color = '#6b7280';
                                    e.target.style.transform = 'rotate(0) scale(1)';
                                }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    color: '#6b7280',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
                
                {/* Content - SIMPLIFIED */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    backgroundColor: '#ffffff'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );

    // Render modal using Portal to ensure it's on top of everything
    return createPortal(modalContent, document.body);
};

export default Modal;