import { useEffect, useRef, useState } from 'react';
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

                sessionStorage.setItem('authToken', result.token);
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

                <p className="auth-brand">Fit'd</p>
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
                        <label>
                            Name
                            <input autoComplete="name" name="username" required />
                        </label>
                    )}
                    <label>
                        Email
                        <input
                            autoComplete="email"
                            name="email"
                            required
                            type="email"
                        />
                    </label>
                    <label>
                        Password
                        <input
                            autoComplete={isSignup ? 'new-password' : 'current-password'}
                            minLength={isSignup ? 8 : undefined}
                            name="password"
                            required
                            type="password"
                        />
                    </label>
                    <button className="auth-submit" type="submit">
                        {isSubmitting
                            ? (isSignup ? 'Creating account...' : 'Logging in...')
                            : (isSignup ? 'Create account' : 'Log in')}
                    </button>
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
    );
}

export default AuthModal;