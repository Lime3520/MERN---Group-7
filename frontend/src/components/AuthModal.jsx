import { useEffect, useRef, useState } from 'react';
import fitdWhiteLogo from "../assets/Fit'd_White.png";
import './authModal.css';

function AuthModal({ mode, onClose, onSwitch }) {
    const dialogRef = useRef(null);
    const isSignup = mode === 'signup';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        return () => {
            if (dialog?.open) {
                dialog.close();
            }
        };
    }, []);

    useEffect(() => {
        setError('');
        setSuccess('');
    }, [mode]);

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = {
            email: formData.get('email'),
            password: formData.get('password'),
        };

        if (isSignup) {
            payload.username = formData.get('username');
        }

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
            const response = await fetch(`${apiBaseUrl}/auth/${isSignup ? 'register' : 'login'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(result.error || result.message || 'The request could not be completed.');
                return;
            }

            if (isSignup) {
                setSuccess(result.message || 'Account created. Check your email to verify it.');
            } else {
                if (!result.token) {
                    throw new Error('The server did not return an authentication token.');
                }
                if (typeof result.user?.username !== 'string' || !result.user.username.trim()) {
                    throw new Error('The server did not return the account name.');
                }

                sessionStorage.setItem('authToken', result.token);
                sessionStorage.setItem('authUsername', result.user.username);
                window.location.assign('/scanner');
            }
        } catch (requestError) {
            setError(
                requestError instanceof TypeError
                    ? 'Could not connect to the server.'
                    : requestError.message
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleSwitch() {
        setError('');
        setSuccess('');
        onSwitch(isSignup ? 'login' : 'signup');
    }

    function handleDialogClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return (
        <>
            <svg aria-hidden="true" className="auth-shape-definitions">
                <defs>
                    <clipPath clipPathUnits="objectBoundingBox" id="auth-modal-shape">
                        <path d="M0 0 H1 V1 H0 Z" />
                    </clipPath>
                </defs>
            </svg>
            <dialog
                aria-labelledby="auth-title"
                className="auth-dialog"
                onCancel={(event) => {
                    event.preventDefault();
                    onClose();
                }}
                onClick={handleDialogClick}
                ref={dialogRef}
            >
                <div className="auth-dialog-content">
                    <button
                        aria-label="Close dialog"
                        className="auth-close"
                        onClick={onClose}
                        type="button"
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>

                    <div className="auth-brand">
                        <img alt="Fit'd" src={fitdWhiteLogo} />
                    </div>
                    <h2 id="auth-title">
                        {isSignup ? 'Create an account' : 'Welcome back'}
                    </h2>
                    <p className="auth-description">
                        {isSignup
                            ? 'Find inspiration and save the things you love.'
                            : 'Log in to pick up where you left off.'}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isSignup && (
                            <input
                                aria-label="Name"
                                autoComplete="name"
                                name="username"
                                placeholder="Name"
                                required
                            />
                        )}
                        <input
                            aria-label="Email"
                            autoComplete="email"
                            name="email"
                            placeholder="Email"
                            required
                            type="email"
                        />
                        <input
                            aria-label="Password"
                            autoComplete={isSignup ? 'new-password' : 'current-password'}
                            minLength={isSignup ? 8 : undefined}
                            name="password"
                            placeholder="Password"
                            required
                            type="password"
                        />
                        <div className="auth-submit-control">
                            <svg
                                aria-hidden="true"
                                className="auth-submit-frame"
                                fill="none"
                                viewBox="0 0 328 123"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="322"
                                    height="97.2736"
                                    rx="48.6368"
                                    fill="black"
                                    fillOpacity="0.2"
                                    stroke="white"
                                    strokeWidth="6"
                                />
                                <g className="auth-submit-bottom">
                                    <mask id="auth-submit-bottom-mask" fill="white">
                                        <path d="M327.059 61.5C327.676 64.6927 328 67.9902 328 71.3633C328 99.8814 304.881 123 276.363 123H51.6367C23.1186 123 4.12379e-05 99.8814 0 71.3633C0 67.9903 0.322928 64.6926 0.94043 61.5C5.54379 85.3004 26.4916 103.273 51.6367 103.273H276.363C301.508 103.273 322.455 85.3003 327.059 61.5Z" />
                                    </mask>
                                    <path
                                        d="M327.059 61.5C327.676 64.6927 328 67.9902 328 71.3633C328 99.8814 304.881 123 276.363 123H51.6367C23.1186 123 4.12379e-05 99.8814 0 71.3633C0 67.9903 0.322928 64.6926 0.94043 61.5C5.54379 85.3004 26.4916 103.273 51.6367 103.273H276.363C301.508 103.273 322.455 85.3003 327.059 61.5Z"
                                        mask="url(#auth-submit-bottom-mask)"
                                        stroke="white"
                                        strokeWidth="12"
                                    />
                                </g>
                            </svg>
                            <button
                                className="auth-submit-button"
                                disabled={isSubmitting}
                                type="submit"
                            >
                                {isSubmitting
                                    ? (isSignup ? 'Creating account...' : 'Logging in...')
                                    : (isSignup ? 'Create account' : 'Log In')}
                            </button>
                        </div>
                    </form>

                    {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
                    {success && <p className="auth-feedback auth-success" role="status">{success}</p>}

                    <p className="auth-switch">
                        {isSignup ? 'Already a member?' : 'New here?'}{' '}
                        <button
                            onClick={handleSwitch}
                            type="button"
                        >
                            {isSignup ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </dialog>
        </>
    );
}

export default AuthModal;