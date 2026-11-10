import { useEffect, useRef, useState } from 'react';
import TopNav from './components/topNav.jsx';
import Body from './components/body.jsx';
import BodyScanner from './components/BodyScanner.jsx';
import ClothingAnalyzer from './components/ClothingAnalyzer.jsx';
import './App.css';

function App() {
    const currentPath = window.location.pathname;
    const isVerifyEmailPage = currentPath === '/verify-email';
    const verificationStarted = useRef(false);
    const [verification, setVerification] = useState({
        status: 'loading',
        message: 'Verifying your email address...',
    });

    useEffect(() => {
        if (!isVerifyEmailPage || verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;
        const token = new URLSearchParams(window.location.search).get('token');

        if (!token) {
            setVerification({
                status: 'error',
                message: 'This verification link is missing its token. Please use the link from your email.',
            });
            return;
        }

        async function verifyEmail() {
            try {
                const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
                const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setVerification({
                        status: 'error',
                        message: result.error || result.message || 'This verification link is invalid or has expired.',
                    });
                    return;
                }

                window.history.replaceState({}, '', '/verify-email');
                setVerification({
                    status: 'success',
                    message: result.message || 'Your email has been verified. You can now log in.',
                });
            } catch (error) {
                setVerification({
                    status: 'error',
                    message: error instanceof TypeError
                        ? 'Could not connect to the server. Please try opening the verification link again.'
                        : error.message,
                });
            }
        }

        verifyEmail();
    }, [isVerifyEmailPage]);

    if (isVerifyEmailPage) {
        return (
            <main className="verification-page">
                <section aria-labelledby="verification-title" className="verification-card">
                    <p className="verification-brand">Fit'd</p>
                    <h1 id="verification-title">Email verification</h1>
                    <p aria-live="polite" role={verification.status === 'error' ? 'alert' : 'status'}>
                        {verification.message}
                    </p>
                    <a href="/">Return to Fit'd</a>
                </section>
            </main>
        );
    }

    if (currentPath === '/clothing-analysis') {
        return <><TopNav /><ClothingAnalyzer /></>;
    }

    if (currentPath === '/scanner' && !sessionStorage.getItem('authToken')) {
        return (
            <>
                <TopNav initialAuthMode="login" />
                <Body />
            </>
        );
    }

    if (currentPath === '/scanner') {
        return (
            <>
                <TopNav />
                <BodyScanner />
            </>
        );
    }

    return (
        <>
            <TopNav />
            <Body />
        </>
    );
}

export default App;
