import { useEffect, useRef, useState } from 'react';
import './cameraCapture.css';

function getCameraErrorMessage(error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'Camera access was denied. Allow camera access in your browser settings and try again.';
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'No camera was found on this device.';
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return 'The camera could not be started. It may already be in use by another app.';
    }

    return error.message || 'The camera could not be opened. Please try again.';
}

function CameraCapture() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mountedRef = useRef(false);
    const photoBlobRef = useRef(null);
    const [cameraStatus, setCameraStatus] = useState('requesting');
    const [photo, setPhoto] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [analysis, setAnalysis] = useState(null);

    function stopCamera() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }

    async function startCamera() {
        setCameraStatus('requesting');
        setCameraError('');

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraStatus('error');
            setCameraError('Camera access is not available in this browser. Try a supported browser over a secure connection.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: 'environment' } },
            });

            if (!mountedRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            stopCamera();
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setCameraStatus('ready');
        } catch (error) {
            stopCamera();
            setCameraError(getCameraErrorMessage(error));
            setCameraStatus('error');
        }
    }

    useEffect(() => {
        mountedRef.current = true;
        startCamera();

        return () => {
            mountedRef.current = false;
            stopCamera();
        };
    }, []);

    function takePhoto() {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) {
            setCameraError('The camera is not ready yet. Please wait a moment and try again.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setCameraError('The photo could not be captured. Please try again.');
            setCameraStatus('error');
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                setCameraError('The photo could not be captured. Please try again.');
                setCameraStatus('error');
                return;
            }

            photoBlobRef.current = blob;
            setPhoto(canvas.toDataURL('image/jpeg', 0.92));
            stopCamera();
            uploadPhoto(blob);
        }, 'image/jpeg', 0.92);
    }

    function retakePhoto() {
        setPhoto(null);
        photoBlobRef.current = null;
        setAnalysis(null);
        startCamera();
    }

    async function uploadPhoto(blob = photoBlobRef.current) {
        if (!blob) {
            setCameraError('The captured photo is not available. Please take it again.');
            setCameraStatus('error');
            return;
        }

        setCameraStatus('uploading');
        setCameraError('');
        const formData = new FormData();
        formData.append('image', blob, 'camera-capture.jpg');

        try {
            const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
            const response = await fetch(`${apiBaseUrl}/clothing/analyze`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken') || ''}` },
                body: formData,
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || result.message || 'The photo could not be analyzed and saved.');
            }

            setAnalysis(result.analysis);
            setCameraStatus('saved');
        } catch (error) {
            setCameraError(error instanceof TypeError
                ? 'Could not connect to the server. Check your connection and try uploading again.'
                : error.message);
            setCameraStatus('error');
        }
    }

    return (
        <main className="camera-page">
            <header className="camera-header">
                <a className="camera-back-link" href="/scanner">Back to My Closet</a>
                <p className="camera-eyebrow">Fit&apos;d camera</p>
                <h1>Take a photo</h1>
                <p>Frame a clothing item, then tap the button. We&apos;ll analyze and save it to your wardrobe.</p>
            </header>

            <section aria-label="Camera" className="camera-workspace">
                <div className="camera-viewfinder">
                    {photo ? (
                        <img alt="Your captured photo" className="camera-photo" src={photo} />
                    ) : (
                        <video
                            autoPlay
                            className="camera-video"
                            muted
                            playsInline
                            ref={videoRef}
                        />
                    )}
                    {cameraStatus === 'requesting' && (
                        <p aria-live="polite" className="camera-overlay-message">Opening camera…</p>
                    )}
                    {cameraStatus === 'uploading' && (
                        <p aria-live="polite" className="camera-overlay-message">Analyzing and saving your photo…</p>
                    )}
                    {cameraStatus === 'error' && (
                        <p aria-live="assertive" className="camera-overlay-message">{cameraError}</p>
                    )}
                </div>

                <div className="camera-controls">
                    {cameraStatus === 'ready' && (
                        <button
                            aria-label="Take photo"
                            className="camera-shutter"
                            onClick={takePhoto}
                            type="button"
                        />
                    )}
                    {(cameraStatus === 'saved' || (cameraStatus === 'error' && photo)) && (
                        <div className="camera-result-actions">
                            {cameraStatus === 'error' && (
                                <button className="camera-retake" onClick={() => uploadPhoto()} type="button">
                                    Retry upload
                                </button>
                            )}
                            <button className="camera-retake" onClick={retakePhoto} type="button">
                                Retake photo
                            </button>
                            {cameraStatus === 'saved' && (
                                <a className="camera-retake" href="/scanner">Back to My Closet</a>
                            )}
                        </div>
                    )}
                    {cameraStatus === 'error' && !photo && (
                        <button className="camera-retake" onClick={startCamera} type="button">
                            Try again
                        </button>
                    )}
                </div>
                {cameraStatus === 'saved' && analysis && (
                    <section aria-live="polite" className="camera-analysis">
                        <p className="camera-analysis-label">Saved to your wardrobe</p>
                        <h2>{analysis.name}</h2>
                        <p>{analysis.description}</p>
                        <dl>
                            <div><dt>Category</dt><dd>{analysis.category}</dd></div>
                            <div><dt>Color</dt><dd>{[analysis.primaryColor, ...analysis.secondaryColors].join(', ')}</dd></div>
                            <div><dt>Material</dt><dd>{analysis.materials.join(', ')}</dd></div>
                            <div><dt>Style</dt><dd>{analysis.styleTags.join(', ')}</dd></div>
                        </dl>
                    </section>
                )}
            </section>
        </main>
    );
}

export default CameraCapture;
