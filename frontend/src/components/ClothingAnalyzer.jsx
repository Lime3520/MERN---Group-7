import { useEffect, useRef, useState } from 'react';
import AuthModal from './AuthModal.jsx';
import './clothingAnalyzer.css';

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export default function ClothingAnalyzer() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [camera, setCamera] = useState(false);
    const [starting, setStarting] = useState(false);
    const [authMode, setAuthMode] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const requestRef = useRef(null);
    const mounted = useRef(false);
    const signedIn = Boolean(sessionStorage.getItem('authToken'));

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!file) { setPreview(''); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (camera && videoRef.current) videoRef.current.srcObject = streamRef.current;
    }, [camera]);

    function stopCamera() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setCamera(false);
    }

    function selectFile(next) {
        setResult(null);
        setError('');
        setFile(null);
        if (!next) return;
        if (!acceptedTypes.includes(next.type)) {
            setError('Choose a JPEG, PNG, WebP, HEIC, or HEIF image.');
            return;
        }
        if (next.size > 10 * 1024 * 1024) {
            setError('Choose an image no larger than 10 MB.');
            return;
        }
        stopCamera();
        setFile(next);
    }

    async function startCamera() {
        setStarting(true);
        setError('');
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera access needs localhost or HTTPS. You can upload a photo instead.');
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            if (!mounted.current) { stream.getTracks().forEach((track) => track.stop()); return; }
            streamRef.current = stream;
            setCamera(true);
        } catch (err) {
            if (mounted.current) setError(err.name === 'NotAllowedError'
                ? 'Camera permission was denied. Allow camera access or upload a photo.'
                : err.message || 'Could not open the camera. Try uploading a photo.');
        } finally {
            if (mounted.current) setStarting(false);
        }
    }

    function takePhoto() {
        const video = videoRef.current;
        if (!video?.videoWidth) { setError('The camera is still starting. Try again in a moment.'); return; }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!mounted.current) return;
            if (blob) selectFile(new File([blob], 'clothing-photo.jpg', { type: 'image/jpeg' }));
            else setError('Could not capture the photo. Please try again.');
        }, 'image/jpeg', 0.9);
    }

    async function analyze() {
        const token = sessionStorage.getItem('authToken');
        if (!token) { setAuthMode('login'); return; }
        if (!file || busy) return;
        setBusy(true);
        setError('');
        setResult(null);
        const controller = new AbortController();
        requestRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), 90000);
        try {
            const form = new FormData();
            form.append('image', file);
            const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
            const response = await fetch(`${base}/clothing/analyze`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
                body: form, signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 401) {
                sessionStorage.removeItem('authToken');
                setAuthMode('login');
                throw new Error('Your session expired. Please log in again.');
            }
            if (!response.ok) throw new Error(data.error || 'Could not analyze this image. Please try again.');
            if (!data.analysis || typeof data.analysis !== 'object') throw new Error('The server returned no clothing analysis.');
            setResult(data);
        } catch (err) {
            if (mounted.current) setError(err.name === 'AbortError'
                ? 'Analysis timed out. Please try again.'
                : err instanceof TypeError ? 'Cannot reach the API. Check that the backend is running.' : err.message);
        } finally {
            clearTimeout(timeout);
            requestRef.current = null;
            if (mounted.current) setBusy(false);
        }
    }

    function downloadJson() {
        const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clothing-analysis.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return (
        <main className="clothing-analyzer">
            <p className="clothing-eyebrow">Fit’d / Your clothing</p>
            <h1>Get to know your clothes.</h1>
            <p>Photograph one item or upload a clear image to see its AI-generated details.</p>
            <p className="clothing-note">Analysis preview only — this does not save clothing to your wardrobe. Your photo is sent to Gemini when you select Analyze.</p>
            {!signedIn && <p>Log in with your verified account to analyze photos. <button type="button" onClick={() => setAuthMode('login')}>Log in</button></p>}
            <div className="clothing-layout">
                <section aria-labelledby="clothing-photo-title" className="clothing-panel">
                    <h2 id="clothing-photo-title">1. Choose a photo</h2>
                    <label className="clothing-file">Upload an image (up to 10 MB)
                        <input type="file" accept={acceptedTypes.join(',')} disabled={busy || starting}
                            onChange={(event) => { const next = event.target.files?.[0]; if (next) selectFile(next); event.target.value = ''; }} />
                    </label>
                    <div className="clothing-actions">
                        {!camera && <button type="button" onClick={startCamera} disabled={busy || starting}>{starting ? 'Opening camera…' : 'Use camera'}</button>}
                        {camera && <><button type="button" onClick={takePhoto}>Take photo</button><button type="button" onClick={stopCamera}>Stop camera</button></>}
                    </div>
                    {camera ? <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
                        : preview ? <><img src={preview} alt="Selected clothing" onError={() => setError('This browser cannot preview this format. You can still analyze it, or choose a JPEG.')} /><p className="clothing-filename">{file.name}</p></>
                        : <div className="clothing-placeholder">Place one clothing item in good light against a simple background.</div>}
                    <button className="clothing-primary" type="button" disabled={!file || busy || camera || starting} onClick={analyze}>{busy ? 'Analyzing…' : 'Analyze clothing'}</button>
                    {busy && <p role="status">Gemini is reviewing your photo. This may take a moment.</p>}
                    {error && <p role="alert" className="clothing-error">{error}</p>}
                </section>
                <section aria-labelledby="clothing-result-title" className="clothing-panel" aria-live="polite">
                    <h2 id="clothing-result-title">2. See the details</h2>
                    {!result ? <p>Your clothing details and formatted JSON will appear here.</p> : <>
                        <h3>{result.analysis.name}</h3>
                        <p>{result.analysis.description}</p>
                        <dl>{['category', 'subcategory', 'primaryColor', 'pattern', 'materials', 'fit', 'styleTags', 'seasons', 'occasions'].map((key) => <div key={key}><dt>{key.replace(/([A-Z])/g, ' $1')}</dt><dd>{Array.isArray(result.analysis[key]) ? result.analysis[key].join(', ') || 'None' : result.analysis[key]}</dd></div>)}</dl>
                        <p className="clothing-note">AI estimates may be incorrect, especially material and fit.</p>
                        <details open><summary>View response JSON</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
                        <button type="button" onClick={downloadJson}>Download JSON</button>
                    </>}
                </section>
            </div>
            {authMode && <AuthModal mode={authMode} onSwitch={setAuthMode} onClose={() => setAuthMode(null)} redirectTo="/clothing-analysis" />}
        </main>
    );
}
