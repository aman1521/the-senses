import React, { useRef, useEffect, useState } from 'react';

const VisionTest = ({ onComplete }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);

    // States: connecting, instructions, test, done
    const [status, setStatus] = useState('connecting');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);

    const accumulatedHarmony = useRef(0);
    const totalFrames = useRef(0);

    // Particle memory for the "ghost" / fade effect
    const particlesRef = useRef([]);

    useEffect(() => {
        // Initialize WebSocket to Python Microservice
        try {
            wsRef.current = new WebSocket('ws://localhost:8000/ws/vision');

            wsRef.current.onopen = () => {
                setStatus('instructions');
                startWebcam();
            };

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleVisionData(data);
            };

            wsRef.current.onclose = () => {
                console.log('Vision WS Closed');
            };
        } catch (e) {
            console.error("WS connection failed", e);
            setTimeout(() => onComplete(50), 3000); // Fallback
        }

        return () => {
            if (wsRef.current) wsRef.current.close();
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error("Webcam error:", e);
        }
    };

    const handleVisionData = (data) => {
        if (status !== 'test') return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');

        // Render the "Ghost" fade effect (semi-transparent black over previous frame)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, w, h);

        if (data.hands && data.hands.length > 0) {
            totalFrames.current += 1;

            // 4: Thumb Tip, 8: Index Tip
            const thumb = data.hands[0].landmarks[4];
            const index = data.hands[0].landmarks[8];

            // Mirroring the X coordinates
            const tx = (1 - thumb.x) * w;
            const ty = thumb.y * h;
            const ix = (1 - index.x) * w;
            const iy = index.y * h;

            // Euclidean Distance
            const dx = ix - tx;
            const dy = iy - ty;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Chaos Factor (0 = pinching/harmony, 1 = wide apart/chaos)
            const chaosFactor = Math.min(Math.max(distance / 200, 0), 1);

            // Metrics accumulation: High Harmony (Low Chaos) = Better Score
            const harmony = 1.0 - chaosFactor;
            accumulatedHarmony.current += harmony;

            // Visual Logic: Haptic Shadow / Tension Particles
            const numParticles = Math.floor(chaosFactor * 50) + 1;
            const isHarmony = chaosFactor < 0.15;

            // Draw floating particles
            for (let i = 0; i < numParticles; i++) {
                const offsetX = (Math.random() * distance * 2) - distance;
                const offsetY = (Math.random() * distance * 2) - distance;

                particlesRef.current.push({
                    x: ix + offsetX,
                    y: iy + offsetY,
                    life: 1.0,
                    color: isHarmony ? '255, 255, 255' : '239, 68, 68' // White if calm, Red if chaotic
                });
            }

            // Draw "The Nerve" connecting thumb and index
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(ix, iy);
            ctx.strokeStyle = isHarmony ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 100, 100, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Joints
            ctx.beginPath();
            ctx.arc(tx, ty, 5, 0, 2 * Math.PI);
            ctx.arc(ix, iy, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
            ctx.fill();
        }

        // Draw and decay particles
        particlesRef.current = particlesRef.current.filter(p => p.life > 0.05);
        particlesRef.current.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
            ctx.fill();
            p.life -= 0.1; // Decay speed
        });
    };

    // Frame Capture Loop
    useEffect(() => {
        let interval;
        if (status === 'test' || status === 'instructions') {
            interval = setInterval(() => {
                if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const hiddenCanvas = document.createElement('canvas');
                hiddenCanvas.width = 640;
                hiddenCanvas.height = 480;
                const ctx = hiddenCanvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, 640, 480);

                // Compress and send to Python Pipeline
                const base64Frame = hiddenCanvas.toDataURL('image/jpeg', 0.4);
                wsRef.current.send(base64Frame);

            }, 100); // 10 FPS
        }
        return () => clearInterval(interval);
    }, [status]);

    // Timer Logic
    useEffect(() => {
        let timer;
        if (status === 'test') {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('done');
                        const finalScore = totalFrames.current > 0 ? (accumulatedHarmony.current / totalFrames.current) * 100 : 0;
                        setScore(Math.round(finalScore));
                        setTimeout(() => onComplete(Math.round(finalScore)), 2000);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, onComplete]);

    return (
        <div className="test-card select-none" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', border: '1px solid #27272a' }}>
            <div className="text-zinc-500 text-sm uppercase tracking-widest mb-4">Motor Intelligence • Haptic Tension</div>

            {status === 'connecting' && <h2 className="mb-6 animate-pulse text-zinc-300">Synchronizing Senses...</h2>}

            {status === 'instructions' && (
                <>
                    <h2 className="mb-2 text-2xl font-bold text-white">Find Harmony</h2>
                    <p className="text-zinc-400 mb-6 text-center max-w-sm text-sm">
                        Bring your Thumb and Index finger close together to minimize the <span className="text-red-400 font-bold">Chaos</span>.
                        Hold them stable to accumulate Harmony.
                    </p>
                    <button className="primary-button" onClick={() => setStatus('test')}>
                        <i className="fa-solid fa-compact-disc"></i> Begin Sequence
                    </button>
                    <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
                </>
            )}

            {(status === 'test' || status === 'done') && (
                <div style={{ position: 'relative', width: '640px', height: '480px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
                    {/* Underlying hidden video to feed stream */}
                    <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

                    {/* Visualizer Canvas */}
                    <canvas
                        ref={canvasRef}
                        width={640}
                        height={480}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
                    />

                    {status === 'test' && (
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.8)', padding: '5px 15px', borderRadius: '20px', color: '#e4e4e7', border: '1px solid #3f3f46', fontFamily: 'monospace', fontSize: '18px' }}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    )}
                </div>
            )}

            {status === 'done' && (
                <div className="mt-8 text-center animate-fade-in p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 w-full max-w-md">
                    <h3 className="text-2xl font-bold text-white mb-2">Motor Stability Logged</h3>
                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-lg">
                        <span className="text-zinc-400">Harmony Resonance</span>
                        <span className={`text-2xl font-bold ${score > 80 ? 'text-green-400' : score > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {score}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisionTest;
