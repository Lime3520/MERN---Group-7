import { useState } from 'react';
import AuthModal from './AuthModal.jsx';
import fashionImage from '../assets/Fashion.jpg';
import './body.css';

function Body() {
    const [authMode, setAuthMode] = useState(null);

    return (
        <main
            aria-label="Fashion inspiration"
            className="fashion-hero"
            style={{ '--fashion-image': `url("${fashionImage}")` }}
        >
            <div className="fashion-overlay">
                <div className="fashion-content">
                    <p className="fashion-eyebrow">Find your style</p>
                    <h1>Wear what moves you.</h1>
                    <div className="fashion-actions">
                        <button onClick={() => setAuthMode('signup')} type="button">
                            Sign Up
                        </button>
                        <button onClick={() => setAuthMode('login')} type="button">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>

            {authMode && (
                <AuthModal
                    mode={authMode}
                    onClose={() => setAuthMode(null)}
                    onSwitch={setAuthMode}
                />
            )}
        </main>
    );
}

export default Body;
