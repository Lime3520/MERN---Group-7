import { useEffect, useState } from 'react';
import AuthModal from './AuthModal.jsx';
import fitdLogo from "../assets/Fit'd..png";
import mern7Graphic from '../assets/MERN_7.png';
import fashionImage from '../assets/Fashion.jpg';
import fashionImage1 from '../assets/Fashion_1.jpg';
import fashionImage2 from '../assets/Fashion_2.jpg';
import fashionImage3 from '../assets/Fashion_3.jpg';
import fashionImage4 from '../assets/Fashion_4.jpg';
import './body.css';

const fashionImages = [
    fashionImage,
    fashionImage1,
    fashionImage2,
    fashionImage3,
    fashionImage4,
];

const fashionSlideDuration = 40;
const fashionSlideInterval = fashionSlideDuration / fashionImages.length;

function Body() {
    const [authMode, setAuthMode] = useState(null);
    const [checkerBurst, setCheckerBurst] = useState(0);

    useEffect(() => {
        if (!checkerBurst) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setCheckerBurst(0), 1100);
        return () => window.clearTimeout(timeoutId);
    }, [checkerBurst]);

    function openAuth(mode) {
        setAuthMode(mode);
        setCheckerBurst((burst) => burst + 1);
    }

    return (
        <main aria-label="Fashion inspiration" className="fashion-hero">
            {checkerBurst > 0 && (
                <div aria-hidden="true" className="fashion-checker-burst" key={checkerBurst}>
                    {Array.from({ length: 80 }, (_, index) => {
                        const row = Math.floor(index / 10);
                        const column = index % 10;

                        return (
                            <span
                                className={`fashion-checker-tile${(row + column) % 2 === 0 ? ' fashion-checker-tile-light' : ''}`}
                                key={index}
                            />
                        );
                    })}
                </div>
            )}
            <div aria-hidden="true" className="fashion-background">
                {fashionImages.map((image, index) => (
                    <div
                        className="fashion-background-image"
                        key={image}
                        style={{
                            '--fashion-image': `url("${image}")`,
                            animationDelay: `${index * fashionSlideInterval - fashionSlideDuration}s`,
                        }}
                    />
                ))}
            </div>
            <div className="fashion-overlay">
                <div className="fashion-content">
                    <svg aria-hidden="true" className="fashion-svg-filters">
                        <defs>
                            <filter id="fashion-line-boil" x="-5%" y="-5%" width="110%" height="110%">
                                <feTurbulence
                                    baseFrequency="0.01"
                                    numOctaves="1"
                                    result="line-noise"
                                    seed="1"
                                    type="fractalNoise"
                                >
                                    <animate
                                        attributeName="seed"
                                        calcMode="discrete"
                                        className="fashion-line-boil-animation"
                                        dur="0.45s"
                                        repeatCount="indefinite"
                                        values="1;2;3;4;5;6;7;8"
                                    />
                                </feTurbulence>
                                <feDisplacementMap
                                    in="SourceGraphic"
                                    in2="line-noise"
                                    scale="3"
                                    xChannelSelector="R"
                                    yChannelSelector="G"
                                />
                            </filter>
                        </defs>
                    </svg>
                    <img alt="MERN 7" className="fashion-team-graphic" src={mern7Graphic} />
                    <img alt="Fit'd" className="fashion-logo" src={fitdLogo} />
                    <p className="fashion-eyebrow">Think it, Make it, Fit it</p>
                    <div className="fashion-actions">
                        <svg
                            aria-hidden="true"
                            className="fashion-actions-frame"
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
                            <g className="fashion-actions-bottom">
                                <mask id="fashion-actions-bottom-mask" fill="white">
                                    <path d="M327.059 61.5C327.676 64.6927 328 67.9902 328 71.3633C328 99.8814 304.881 123 276.363 123H51.6367C23.1186 123 4.12379e-05 99.8814 0 71.3633C0 67.9903 0.322928 64.6926 0.94043 61.5C5.54379 85.3004 26.4916 103.273 51.6367 103.273H276.363C301.508 103.273 322.455 85.3003 327.059 61.5Z" />
                                </mask>
                                <path
                                    d="M327.059 61.5C327.676 64.6927 328 67.9902 328 71.3633C328 99.8814 304.881 123 276.363 123H51.6367C23.1186 123 4.12379e-05 99.8814 0 71.3633C0 67.9903 0.322928 64.6926 0.94043 61.5C5.54379 85.3004 26.4916 103.273 51.6367 103.273H276.363C301.508 103.273 322.455 85.3003 327.059 61.5Z"
                                    mask="url(#fashion-actions-bottom-mask)"
                                    stroke="white"
                                    strokeWidth="12"
                                />
                            </g>
                        </svg>
                        <button className="fashion-action-button" onClick={() => openAuth('login')} type="button">
                            Sign In
                        </button>
                    </div>
                    <button
                        className="fashion-signup-link"
                        onClick={() => openAuth('signup')}
                        type="button"
                    >
                        Sign Up
                    </button>
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
