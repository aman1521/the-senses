import React, { useRef, useState, useEffect } from 'react';

/**
 * ReflexTest Component
 * Canvas-based drawing test to measure reaction time, motor control, and attention.
 * @param {function} onComplete - Callback with results { reactionTimeMs, accuracyScore, ... }
 */
const ReflexTest = ({ onComplete }) => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('intro'); // intro, countdown, draw, result
    const [round, setRound] = useState(1);
    const totalRounds = 2;
    const [mode, setMode] = useState('standard'); // 'standard', 'distractor'
    const [distractors, setDistractors] = useState([]);

    const [metrics, setMetrics] = useState({ reactionTimeMs: 0, accuracyScore: 0, strokeConsistency: 0, correctionCount: 0 });
    const [path, setPath] = useState([]);
    const [targetShape, setTargetShape] = useState([]);
    const [startTime, setStartTime] = useState(0);
    const [count, setCount] = useState(3);
    const CANVAS_SIZE = 300;
    const TOLERANCE = 20;

    // Helper: Generate random shape points
    const generateShape = () => {
        const points = [];
        const radius = 100;
        const center = CANVAS_SIZE / 2;
        for (let i = 0; i <= 360; i += 5) {
            const rad = (i * Math.PI) / 180;
            // Add some irregularity
            const r = radius + (Math.sin(rad * 5) * 10);
            points.push({
                x: center + r * Math.cos(rad),
                y: center + r * Math.sin(rad)
            });
        }
        setTargetShape(points);
    };

    // Helper: Handle drawing events
    const handleStart = (e) => {
        if (gameState !== 'draw') return;
        const pos = getPos(e);
        setPath([pos]);
        // First interaction captures reaction time
        if (metrics.reactionTimeMs === 0) {
            setMetrics(prev => ({ ...prev, reactionTimeMs: Date.now() - startTime }));
        }
    };

    const handleMove = (e) => {
        if (gameState !== 'draw' || path.length === 0) return;
        const pos = getPos(e);
        setPath(prev => [...prev, pos]);
    };

    const handleEnd = () => {
        if (gameState !== 'draw') return;
        finishTest(path);
    };

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Countdown logic
    useEffect(() => {
        let timer;
        if (gameState === 'countdown') {
            if (count > 0) {
                timer = setTimeout(() => setCount(c => c - 1), 1000);
            } else {
                startGame();
            }
        } else if (gameState === 'intro') {
            setCount(3);
        }
        return () => clearTimeout(timer);
    }, [gameState, count]);

    useEffect(() => {
        if (gameState === 'draw' && mode === 'distractor') {
            const interval = setInterval(() => {
                setDistractors(prev => [
                    ...prev.slice(-4), // Keep max 5
                    {
                        id: Date.now(),
                        x: Math.random() * CANVAS_SIZE,
                        y: Math.random() * CANVAS_SIZE,
                        color: Math.random() > 0.5 ? '#ef4444' : '#eab308'
                    }
                ]);
            }, 400);
            return () => clearInterval(interval);
        }
    }, [gameState, mode]);

    const startGame = () => {
        setGameState('draw');
        setStartTime(Date.now());
        if (round === 2) setMode('distractor');
        generateShape();
        setPath([]);
    };

    // Render Canvas
    useEffect(() => {
        if (!canvasRef.current || gameState !== 'draw') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw Target Shape (Faint Blue)
        if (targetShape.length > 0) {
            ctx.beginPath();
            ctx.moveTo(targetShape[0].x, targetShape[0].y);
            targetShape.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.lineWidth = 15;
            ctx.stroke();

            // Draw Starting Point (Green Dot)
            ctx.beginPath();
            ctx.arc(targetShape[0].x, targetShape[0].y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
        }

        // Draw User Path (White)
        if (path.length > 0) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }, [gameState, targetShape, path]);

    const finishTest = (finalPath) => {
        const endTime = Date.now();

        // --- Calculate Metrics ---
        // 1. Accuracy (Frechet distance simplified)
        let totalError = 0;
        finalPath.forEach(p => {
            let minD = Infinity;
            targetShape.forEach(t => {
                const d = Math.hypot(p.x - t.x, p.y - t.y);
                if (d < minD) minD = d;
            });
            totalError += minD;
        });
        const avgError = totalError / finalPath.length;
        const accuracy = Math.max(0, 1 - (avgError / TOLERANCE));

        // 2. Stroke Consistency (Jitter / Smoothness)
        // Calc variance of distance between consecutive points
        let variances = [];
        for (let i = 1; i < finalPath.length; i++) {
            const d = Math.hypot(finalPath[i].x - finalPath[i - 1].x, finalPath[i].y - finalPath[i - 1].y);
            variances.push(d);
        }
        const meanDist = variances.reduce((a, b) => a + b, 0) / variances.length;
        const variance = variances.reduce((a, b) => a + Math.pow(b - meanDist, 2), 0) / variances.length;
        const consistency = Math.max(0, 1 - (variance / 50)); // heuristic

        // Accumulate metrics
        const roundMetrics = {
            reactionTimeMs: metrics.reactionTimeMs, // Captured on first touch
            accuracyScore: accuracy,
            strokeConsistency: consistency,
            correctionCount: 0
        };

        if (round < totalRounds) {
            setMetrics(prev => ({
                reactionTimeMs: (prev.reactionTimeMs + roundMetrics.reactionTimeMs) / 2, // Average
                accuracyScore: (prev.accuracyScore + roundMetrics.accuracyScore) / 2,
                strokeConsistency: (prev.strokeConsistency + roundMetrics.strokeConsistency) / 2,
                correctionCount: prev.correctionCount // Accumulate?
            }));
            setGameState('intro'); // Go back to intro for next round
            setRound(r => r + 1);
        } else {
            // Finalize
            const finalMetrics = {
                reactionTimeMs: (metrics.reactionTimeMs + roundMetrics.reactionTimeMs) / 2,
                accuracyScore: parseFloat(((metrics.accuracyScore + roundMetrics.accuracyScore) / 2).toFixed(2)),
                strokeConsistency: parseFloat(((metrics.strokeConsistency + roundMetrics.strokeConsistency) / 2).toFixed(2)),
                correctionCount: 0
            };
            setGameState('result');
            setMetrics(finalMetrics);
            setTimeout(() => onComplete(finalMetrics), 1500);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-900 rounded-xl border border-gray-700 shadow-xl max-w-md mx-auto select-none relative overflow-hidden">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
                Reflex & Attention Check {round}/{totalRounds}
            </h3>

            {gameState === 'intro' && (
                <div className="text-center z-10 relative group">
                    <p className="text-gray-400 mb-6">
                        {round === 1 ? (
                            <>
                                Trace the shape as accurately as possible. <br />
                                <span className="text-xs text-blue-400 mt-2 block">
                                    <i className="fa-solid fa-circle-info mr-1"></i>
                                    Tip: Smoothness counts more than raw speed!
                                </span>
                            </>
                        ) : (
                            <>
                                Round 2: <strong className="text-red-400">Ignore the distractions!</strong> <br />
                                <span className="text-xs text-yellow-500 mt-2 block">
                                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                    Focus only on the blue line. Red dots are traps.
                                </span>
                            </>
                        )}
                    </p>
                    <button
                        onClick={() => setGameState('countdown')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                    >
                        {round === 1 ? "Start" : "Start Round 2"}
                    </button>
                </div>
            )}

            {gameState === 'countdown' && (
                <div className="text-6xl font-bold text-blue-400 animate-pulse z-10">
                    {count}
                </div>
            )}

            {gameState === 'draw' && (
                <div className="relative touch-none">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="bg-gray-800 rounded-lg cursor-crosshair touch-none relative z-20"
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />

                    {/* Distractors */}
                    {mode === 'distractor' && distractors.map(d => (
                        <div
                            key={d.id}
                            className="absolute rounded-full opacity-50 pointer-events-none animate-ping"
                            style={{
                                left: d.x,
                                top: d.y,
                                width: '20px',
                                height: '20px',
                                background: d.color,
                                zIndex: 30
                            }}
                        />
                    ))}

                    <p className="mt-2 text-sm text-gray-500 text-center">
                        Trace the circle starting from the green dot
                    </p>
                </div>
            )}

            {gameState === 'result' && (
                <div className="text-center z-10">
                    <div className="text-4xl mb-2"><i className="fa-regular fa-circle-check text-green-500"></i></div>
                    <p className="text-gray-300 font-medium">Processing Reflexes...</p>
                </div>
            )}
        </div>
    );
};

export default ReflexTest;
