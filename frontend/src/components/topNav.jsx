import { useState } from 'react';
import SearchBar from './SearchBar.jsx';
import AuthModal from './AuthModal.jsx';
import './topNav.css';

function TopNav({ initialAuthMode = null }) {
    const [authMode, setAuthMode] = useState(initialAuthMode);

    return (
        <>
            <nav className="top-nav" aria-label="Main navigation">
                <a className="nav-logo" href="/" aria-label="FitNo'd home">
                    Fit'd
                </a>

                <div className="nav-links">
                    <a href="/explore">Explore</a>
                    <a href="/shop">Shop</a>
                </div>

                <SearchBar />

                <a className="nav-about" href="/about">About</a>

                <div className="auth-actions">
                    <button
                        className="auth-button auth-signup"
                        onClick={() => setAuthMode('signup')}
                        type="button"
                    >
                        Sign up
                    </button>
                    <button
                        className="auth-button auth-login"
                        onClick={() => setAuthMode('login')}
                        type="button"
                    >
                        Log in
                    </button>
                </div>
            </nav>

            {authMode && (
                <AuthModal
                    mode={authMode}
                    onClose={() => setAuthMode(null)}
                    onSwitch={setAuthMode}
                />
            )}
        </>
    );
}

export default TopNav;