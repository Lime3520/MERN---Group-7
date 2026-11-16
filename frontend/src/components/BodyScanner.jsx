import { useEffect, useRef, useState } from 'react';
import './bodyScanner.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const stylePresets = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: '2000s', label: '2000s / Y2K' },
    { value: 'streetwear', label: 'Streetwear' },
    { value: 'formal', label: 'Formal' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'sporty', label: 'Sporty' },
];

function ClothingImage({ item }) {
    const [imageUrl, setImageUrl] = useState('');
    const [imageError, setImageError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        let objectUrl;

        async function loadImage() {
            try {
                const response = await fetch(`${apiBaseUrl}/clothing/${item.id}/image`, {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` },
                    signal: controller.signal,
                });
                if (!response.ok) {
                    throw new Error('Photo could not be loaded.');
                }

                objectUrl = URL.createObjectURL(await response.blob());
                setImageUrl(objectUrl);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setImageError(error.message);
                }
            }
        }

        loadImage();
        return () => {
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [item.id]);

    if (imageError) {
        return <span aria-label={imageError} className="closet-image-error">Photo unavailable</span>;
    }

    return imageUrl
        ? <img alt={item.analysis.name} src={imageUrl} />
        : <span aria-label="Loading photo" className="closet-image-loading" />;
}

function BodyScanner() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [username] = useState(() => sessionStorage.getItem('authUsername') || 'Account');
    const [clothingItems, setClothingItems] = useState([]);
    const [wardrobeStatus, setWardrobeStatus] = useState('loading');
    const [wardrobeError, setWardrobeError] = useState('');
    const [stylePreset, setStylePreset] = useState('casual');
    const [outfitStatus, setOutfitStatus] = useState('idle');
    const [outfitError, setOutfitError] = useState('');
    const [outfitResult, setOutfitResult] = useState(null);
    const accountRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();

        async function loadWardrobe() {
            try {
                const response = await fetch(`${apiBaseUrl}/clothing`, {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` },
                    signal: controller.signal,
                });
                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(result.error || 'Your wardrobe could not be loaded.');
                }

                if (!Array.isArray(result.items)) {
                    throw new Error('The server returned an invalid wardrobe response.');
                }
                setClothingItems(result.items);
                setWardrobeStatus('loaded');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setWardrobeError(error.message);
                    setWardrobeStatus('error');
                }
            }
        }

        loadWardrobe();
        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!accountRef.current?.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen]);

    function handleLogout() {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUsername');
        window.location.assign('/');
    }

    async function generateOutfits() {
        setOutfitStatus('loading');
        setOutfitError('');
        setOutfitResult(null);

        try {
            const response = await fetch(`${apiBaseUrl}/outfits/generate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode: 'random', style: stylePreset, count: 3 }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || 'Outfit suggestions could not be generated.');
            }

            setOutfitResult(result);
            setOutfitStatus('loaded');
        } catch (error) {
            setOutfitError(error instanceof TypeError
                ? 'Could not connect to the server. Check your connection and try again.'
                : error.message);
            setOutfitStatus('error');
        }
    }

    return (
        <main className="body-scanner-page">
            <div className="scanner-account" ref={accountRef}>
                <button
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    className="scanner-account-trigger"
                    onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                    type="button"
                >
                    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M4.5 20c.5-3.7 3.4-5.8 7.5-5.8s7 2.1 7.5 5.8" />
                    </svg>
                    <span>{username}</span>
                </button>
                {isMenuOpen && (
                    <div className="scanner-account-menu" role="menu">
                        <button onClick={handleLogout} role="menuitem" type="button">
                            Log out
                        </button>
                    </div>
                )}
            </div>
            <section aria-labelledby="closet-title" className="closet">
                <header className="closet-header">
                    <p className="closet-eyebrow">Your wardrobe</p>
                    <h1 id="closet-title">My Closet</h1>
                    <p className="closet-description">Your saved clothing and AI-powered outfit ideas.</p>
                </header>
                <a aria-label="Open camera to take a photo" className="camera-launch" href="/camera">
                    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                        <path d="M4 7.5h3l1.5-2h7l1.5 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
                        <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    <span>Take a photo</span>
                </a>
                {wardrobeStatus === 'loading' && <p aria-live="polite">Loading your wardrobe…</p>}
                {wardrobeStatus === 'error' && <p aria-live="assertive" className="wardrobe-error">{wardrobeError}</p>}
                {wardrobeStatus === 'loaded' && clothingItems.length === 0 && (
                    <p className="wardrobe-empty">Your wardrobe is empty. Take a photo of a clothing item to get started.</p>
                )}
                {clothingItems.length > 0 && (
                    <>
                        <div className="closet-grid">
                            {clothingItems.map((item, index) => (
                                <article className="closet-item" key={item.id}>
                                    <div className="closet-item-image">
                                        <ClothingImage item={item} />
                                    </div>
                                    <div className="closet-item-caption">
                                        <h2>{item.analysis.name}</h2>
                                        <span>{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <section aria-labelledby="outfit-title" className="outfit-generator">
                            <div>
                                <p className="closet-eyebrow">Style it</p>
                                <h2 id="outfit-title">Generate outfits</h2>
                                <p>Choose a style and let AI combine pieces from your wardrobe.</p>
                            </div>
                            <div className="outfit-controls">
                                <label htmlFor="outfit-style">Style preset</label>
                                <select
                                    id="outfit-style"
                                    onChange={(event) => setStylePreset(event.target.value)}
                                    value={stylePreset}
                                >
                                    {stylePresets.map((preset) => (
                                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                                    ))}
                                </select>
                                <button
                                    disabled={outfitStatus === 'loading'}
                                    onClick={generateOutfits}
                                    type="button"
                                >
                                    {outfitStatus === 'loading' ? 'Generating…' : 'Get outfit ideas'}
                                </button>
                            </div>
                            {outfitError && <p aria-live="assertive" className="wardrobe-error">{outfitError}</p>}
                            {outfitResult && (
                                <div aria-live="polite" className="outfit-results">
                                    {outfitResult.message && <p>{outfitResult.message}</p>}
                                    {outfitResult.outfits.map((outfit) => (
                                        <article className="outfit-result" key={`${outfit.name}-${outfit.clothingIds.join('-')}`}>
                                            <h3>{outfit.name}</h3>
                                            <p>{outfit.explanation}</p>
                                            <div className="outfit-items">
                                                {outfit.clothingIds.map((id) => {
                                                    const item = clothingItems.find((clothing) => clothing.id === id);
                                                    return item ? (
                                                        <ClothingImage item={item} key={id} />
                                                    ) : null;
                                                })}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}

export default BodyScanner;
