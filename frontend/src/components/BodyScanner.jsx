import { useEffect, useRef, useState } from 'react';
import './bodyScanner.css';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

function getPoseSpans(landmarks, frameWidth, frameHeight, heightCm) {
    const requiredIndices = [0, 11, 12, 23, 24, 27, 28];
    const requiredPoints = requiredIndices.map((index) => landmarks[index]);

    if (requiredPoints.some((point) => !point || (point.visibility ?? 0) < 0.5)) {
        return null;
    }

    const [nose, leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle] = requiredPoints;
    const shoulderWidth = Math.hypot(
        (leftShoulder.x - rightShoulder.x) * frameWidth,
        (leftShoulder.y - rightShoulder.y) * frameHeight,
    );
    const hipWidth = Math.hypot(
        (leftHip.x - rightHip.x) * frameWidth,
        (leftHip.y - rightHip.y) * frameHeight,
    );
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2 * frameHeight;
    const visibleBodyHeight = ankleY - nose.y * frameHeight;

    if (visibleBodyHeight <= 0 || shoulderWidth <= 0 || hipWidth <= 0) {
        return null;
    }

    const centimetersPerPixel = heightCm * 0.9 / visibleBodyHeight;

    return {
        shoulderSpan: Math.round(shoulderWidth * centimetersPerPixel),
        hipSpan: Math.round(hipWidth * centimetersPerPixel),
    };
}

function BodyScanner() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const landmarkerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastPoseRef = useRef(null);
    const disposedRef = useRef(false);
    const [height, setHeight] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [poseReady, setPoseReady] = useState(false);
    const [measurements, setMeasurements] = useState(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    function stopScan() {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        landmarkerRef.current?.close();
        landmarkerRef.current = null;
        lastPoseRef.current = null;
        setIsScanning(false);
        setPoseReady(false);
        setStatus('Camera stopped.');
    }

    useEffect(() => {
        disposedRef.current = false;
        return () => {
            disposedRef.current = true;
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            streamRef.current?.getTracks().forEach((track) => track.stop());
            landmarkerRef.current?.close();
        };
    }, []);

    async function startScan() {
        setIsStarting(true);
        setError('');
        setMeasurements(null);
        setPoseReady(false);
        setStatus('Loading the on-device pose model...');

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Camera access requires a supported browser and a secure (HTTPS) connection.');
            setStatus('');
            setIsStarting(false);
            return;
        }

        let stream;
        try {
            const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
            const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
            const landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: POSE_MODEL_URL },
                runningMode: 'VIDEO',
                numPoses: 1,
                minPoseDetectionConfidence: 0.6,
                minPosePresenceConfidence: 0.6,
                minTrackingConfidence: 0.6,
            });

            if (disposedRef.current) {
                landmarker.close();
                return;
            }

            landmarkerRef.current = landmarker;
            stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: 'user' },
            });

            if (disposedRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                landmarker.close();
                return;
            }

            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setIsScanning(true);
            setStatus('Stand facing the camera with your full body visible.');

            let lastDetectionTime = 0;
            const detectPose = (timestamp) => {
                const video = videoRef.current;
                const poseLandmarker = landmarkerRef.current;
                if (!video || !poseLandmarker || !streamRef.current) {
                    return;
                }

                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && timestamp - lastDetectionTime > 150) {
                    lastDetectionTime = timestamp;
                    const result = poseLandmarker.detectForVideo(video, timestamp);
                    const landmarks = result.landmarks[0];
                    lastPoseRef.current = landmarks
                        ? getPoseSpans(landmarks, video.videoWidth, video.videoHeight, Number(height))
                        : null;

                    const ready = Boolean(lastPoseRef.current);
                    setPoseReady((previous) => previous === ready ? previous : ready);
                    setStatus(ready
                        ? 'Pose detected. Hold still and capture your estimate.'
                        : 'Move back until your full body is visible, facing the camera.');
                }

                animationFrameRef.current = requestAnimationFrame(detectPose);
            };

            animationFrameRef.current = requestAnimationFrame(detectPose);
        } catch (scanError) {
            stream?.getTracks().forEach((track) => track.stop());
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
            setError(scanError.name === 'NotAllowedError'
                ? 'Camera permission was denied. Allow camera access in your browser settings, then try again.'
                : `Could not start the scanner: ${scanError.message}`);
            setStatus('');
            setIsScanning(false);
        } finally {
            setIsStarting(false);
        }
    }

    function captureEstimate() {
        if (!lastPoseRef.current) {
            setError('No clear full-body pose was detected. Adjust your position and try again.');
            return;
        }

        setMeasurements(lastPoseRef.current);
        setError('');
        stopScan();
        setStatus('');
    }

    const heightValue = Number(height);
    const isHeightValid = Number.isFinite(heightValue) && heightValue >= 120 && heightValue <= 230;

    return (
        <main className="body-scanner-page">
            <section aria-labelledby="scanner-title" className="body-scanner">
                <a className="scanner-back-link" href="/">← Back to home</a>
                <p className="scanner-eyebrow">On-device fit estimate</p>
                <h1 id="scanner-title">Body scan</h1>
                <p className="scanner-intro">
                    The camera estimates pose landmarks in your browser. Enter your height to scale
                    rough shoulder and hip spans.
                </p>

                <div className="scanner-privacy">
                    Your camera feed is processed on this device only. The scanner model and
                    runtime are downloaded from public CDNs, but photos and video are not uploaded
                    or saved. Estimates are approximate and are not body circumferences or
                    tailoring measurements.
                </div>

                <label className="scanner-height">
                    Your height
                    <span className="scanner-height-input">
                        <input
                            autoComplete="off"
                            max="230"
                            min="120"
                            disabled={isScanning || isStarting}
                            onChange={(event) => setHeight(event.target.value)}
                            placeholder="e.g. 170"
                            type="number"
                            value={height}
                        />
                        <span>cm</span>
                    </span>
                </label>

                <div className={`scanner-camera${isScanning ? ' is-active' : ''}`}>
                    <video aria-label="Live camera preview for pose estimation" muted playsInline ref={videoRef} />
                    {!isScanning && (
                        <div className="scanner-camera-placeholder">
                            <span aria-hidden="true">⌖</span>
                            <p>Your live camera preview will appear here.</p>
                        </div>
                    )}
                </div>

                {status && <p aria-live="polite" className="scanner-status" role="status">{status}</p>}
                {error && <p className="scanner-error" role="alert">{error}</p>}

                <div className="scanner-actions">
                    {!isScanning ? (
                        <button disabled={!isHeightValid || isStarting} onClick={startScan} type="button">
                            {isStarting ? 'Preparing scan...' : 'Start camera scan'}
                        </button>
                    ) : (
                        <>
                            <button disabled={!poseReady} onClick={captureEstimate} type="button">
                                Capture estimate
                            </button>
                            <button className="scanner-secondary" onClick={stopScan} type="button">
                                Stop camera
                            </button>
                        </>
                    )}
                </div>

                {measurements && (
                    <section aria-labelledby="results-title" className="scanner-results">
                        <h2 id="results-title">Rough pose-based spans</h2>
                        <dl>
                            <div>
                                <dt>Shoulder joint span</dt>
                                <dd>~{measurements.shoulderSpan} cm</dd>
                            </div>
                            <div>
                                <dt>Hip joint span</dt>
                                <dd>~{measurements.hipSpan} cm</dd>
                            </div>
                        </dl>
                        <p>
                            These are estimates between pose landmarks, not measurements around
                            your body. Camera angle, distance, and posture can affect the result.
                        </p>
                    </section>
                )}
            </section>
        </main>
    );
}

export default BodyScanner;
