import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { generateQuestions } from "../services/api";
import { useTelemetry } from "../hooks/useTelemetry";
import ReflexTest from "../components/ReflexTest";
import VisionTest from "../components/VisionTest";
import QuestionSection from "../components/QuestionSection";
import { useTestEngine } from "../hooks/useTestEngine";
import "./Test.css";

// [Test Components]





const FullScreenGate = ({ onEnter }) => (
  <div className="test-card start-screen">
    <h1 className="start-title">The Senses</h1>
    <p style={{ fontSize: '18px', color: '#fff' }}>The Senses turns thinking ability into social proof.</p>

    <ul style={{ textAlign: 'left', margin: '30px auto', maxWidth: '300px', color: '#ccc', lineHeight: '1.8' }}>
      <li><i className="fa-solid fa-check"></i> Camera-Verified</li>
      <li><i className="fa-solid fa-bolt"></i> One Attempt Only</li>
      <li><i className="fa-solid fa-shield-halved"></i> Integrity Matters</li>
    </ul>

    <button className="primary-button" onClick={() => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().then(onEnter).catch(() => onEnter());
      } else {
        onEnter();
      }
    }}>
      Begin Verification
    </button>
  </div>
);

const DeviceCheck = ({ onComplete }) => {
  const [checks, setChecks] = useState({ camera: false, mic: false, net: true });
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        setChecks(c => ({ ...c, camera: true, mic: true }));
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const allPassed = checks.camera && checks.mic && checks.net;

  return (
    <div className="test-card">
      <h2>System & Consent Check</h2>
      <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
        <div style={{ flex: 1, background: '#000', borderRadius: '8px', overflow: 'hidden', height: '200px' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <div className={checks.camera ? "flex items-center gap-2 text-green-400 font-medium bg-green-500/10 p-3 rounded-lg" : "flex items-center gap-2 text-red-400 font-medium bg-red-500/10 p-3 rounded-lg"}>
            {checks.camera ? <><i className="fa-solid fa-check"></i> Camera Access</> : <><i className="fa-solid fa-video-slash"></i> Camera Blocked</>}
          </div>
          <div className={checks.mic ? "flex items-center gap-2 text-green-400 font-medium bg-green-500/10 p-3 rounded-lg" : "flex items-center gap-2 text-red-400 font-medium bg-red-500/10 p-3 rounded-lg"}>
            {checks.mic ? <><i className="fa-solid fa-microphone"></i> Microphone Access</> : <><i className="fa-solid fa-microphone-slash"></i> Mic Blocked</>}
          </div>
          <div className="flex items-center gap-2 text-green-400 font-medium bg-green-500/10 p-3 rounded-lg">
            <i className="fa-solid fa-wifi"></i> Connection Active
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
          <input type="checkbox" defaultChecked disabled style={{ marginRight: '10px' }} /> I consent to video recording for identity verification.
        </label>
        <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
          <input type="checkbox" defaultChecked disabled style={{ marginRight: '10px' }} /> I agree to anti-cheat monitoring (tab switching, focus tracking).
        </label>
      </div>

      <button className="primary-button" disabled={!allPassed} onClick={onComplete} style={{ opacity: allPassed ? 1 : 0.5 }}>
        {allPassed ? "I Agree & Continue" : "Checks Failed"}
      </button>
    </div>
  );
};

const IntroductionRecorder = ({ onComplete }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'intro.webm');

      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/video`, {
          method: 'POST',
          body: formData
        });
        onComplete(blob);
      } catch (e) {
        console.error("Upload failed", e);
        onComplete(blob); // Proceed even if upload fails
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRecording(false);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  return (
    <div className="test-card intro-stage">
      <h2>Stage 1: Video Introduction</h2>
      <p>Who are you, and why are you taking The Senses test?</p>

      <div className="video-preview">
        <video ref={videoRef} autoPlay muted playsInline className="live-feed" />
      </div>


      <div className="controls" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {!recording ? (
          <>
            <button className="primary-button" onClick={startRecording}>
              <i className="fa-solid fa-video"></i> Start Recording (60s)
            </button>
            <button className="secondary-button" onClick={() => onComplete(null)}>
              Skip <i className="fa-solid fa-forward"></i>
            </button>
          </>
        ) : (
          <button className="primary-button bg-red-600 hover:bg-red-700" onClick={() => {
            setRecording(false);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
          }}>
            <i className="fa-solid fa-stop"></i> Stop & Submit ({timeLeft}s)
          </button>
        )}
      </div>
    </div>
  );
};

const ProctorMonitor = ({ integrityScore, webcamRef, deviceAlerts = [], voiceAlerts = [] }) => {
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  // Use external ref if provided, otherwise local
  const videoRef = webcamRef || localVideoRef;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => console.error("Proctor cam failed", err));

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [videoRef]);

  return (
    <div className="proctor-monitor">
      <div className="cam-feed">
        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <div className="recording-indicator"></div>
        <span className="cam-label">Integrity: {integrityScore}%</span>

        {/* Device Alert Badge */}
        {deviceAlerts.length > 0 && (
          <div className="device-alert-badge" style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            {deviceAlerts.length} Device{deviceAlerts.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Voice Alert Badge */}
        {voiceAlerts.length > 0 && (
          <div className="voice-alert-badge" style={{
            position: 'absolute',
            top: deviceAlerts.length > 0 ? '30px' : '5px',
            right: '5px',
            background: 'rgba(249, 115, 22, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <i className="fa-solid fa-microphone"></i>
            {voiceAlerts.length} Voice Alert{voiceAlerts.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};



const MemoryTest = ({ onComplete }) => {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [pattern, setPattern] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [status, setStatus] = useState("start"); // start, show, input, success, fail
  const [score, setScore] = useState(0);

  const startFlashRound = () => {
    const tileCount = Math.min(8, level + 2);
    const totalTiles = gridSize * gridSize;
    const newPattern = new Set();
    while (newPattern.size < tileCount) {
      newPattern.add(Math.floor(Math.random() * totalTiles));
    }

    setPattern(Array.from(newPattern));
    setUserSequence([]);
    setStatus("show");
  };

  useEffect(() => {
    if (status === 'show') {
      const timer = setTimeout(() => {
        setStatus("input");
      }, 1000 + (level * 200));
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleTileClick = (index) => {
    if (status !== "input") return;

    const newSeq = userSequence.includes(index)
      ? userSequence.filter(i => i !== index)
      : [...userSequence, index];

    setUserSequence(newSeq);

    if (newSeq.length === pattern.length) {
      // Check correctness
      const sortedPattern = [...pattern].sort();
      const sortedUser = [...newSeq].sort();
      const match = JSON.stringify(sortedPattern) === JSON.stringify(sortedUser);

      if (match) {
        setScore(s => s + (level * 10)); // Accumulate score
        if (level >= 5) { // Max 5 levels for brevity
          setStatus("done");
          setTimeout(() => onComplete(score + (level * 10)), 1000);
        } else {
          setStatus("success");
          setTimeout(() => {
            setLevel(l => l + 1);
            if (level % 2 === 0) setGridSize(g => g + 1);
            startFlashRound();
          }, 1000);
        }
      } else {
        setStatus("fail");
        setTimeout(() => onComplete(score), 1500);
      }
    }
  };

  return (
    <div className="test-card select-none" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-zinc-500 text-sm uppercase tracking-widest mb-4">Working Memory • Level {level}</div>
      <h2 className="mb-6">{status === 'start' ? 'Visual Memory' : (status === 'input' ? 'Recall Pattern' : (status === 'show' ? 'Watch Carefully' : '...'))}</h2>

      {status === 'start' && (
        <button className="primary-button" onClick={() => { setLevel(1); startFlashRound(); }}>
          <i className="fa-solid fa-brain"></i> Start Memory Test
        </button>
      )}

      {(status === 'show' || status === 'input' || status === 'success' || status === 'fail') && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '10px',
          width: '300px',
          height: '300px'
        }}>
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const isPattern = pattern.includes(i) && (status === 'show' || status === 'fail' || status === 'success');
            const isSelected = userSequence.includes(i);
            const isError = status === 'fail' && isSelected && !pattern.includes(i);

            return (
              <div
                key={i}
                onClick={() => handleTileClick(i)}
                className={`
                                rounded-xl transition-all duration-200 cursor-pointer
                                ${isPattern ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] scale-105' :
                    isError ? 'bg-red-500' :
                      isSelected ? 'bg-indigo-400' : 'bg-zinc-800 hover:bg-zinc-700'}
                            `}
              />
            );
          })}
        </div>
      )}

      {status === 'fail' && <div className="text-red-400 mt-6 font-bold text-xl animate-pulse">Incorrect Sequence</div>}
      {status === 'success' && <div className="text-green-400 mt-6 font-bold text-xl animate-bounce">Perfect!</div>}
    </div>
  );
};

/* --- NEW: Research & Integrity Modal --- */
const ResearchDisclosureModal = ({ onAnalyze }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-blue-400">
          <i className="fa-solid fa-microscope text-2xl"></i>
          <h2 className="text-xl font-bold text-white">Research & Integrity Check</h2>
        </div>

        <div className="space-y-4 text-gray-300 text-sm leading-relaxed mb-6">
          <p>
            The Senses uses advanced <strong>behavioral telemetry</strong> and <strong>reflex testing</strong> to verify your cognitive performance.
          </p>
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <h4 className="text-gray-100 font-semibold mb-2 flex items-center gap-2">
              <i className="fa-solid fa-server text-blue-500"></i> What We Analyze:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Reaction time & motor control consistency</li>
              <li>Focus patterns (tab switching, visibility)</li>
              <li>Interaction timing (copy/paste heuristics)</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 italic">
            * This data generates a "Confidence Score" that validates your result. No personal files or browsing history are accessed.
          </p>
        </div>

        <button
          onClick={onAnalyze}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          I Understand & Consent <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

function Test() {
  const navigate = useNavigate();
  // Use Core Engine
  const { state: engineState, actions } = useTestEngine();
  const { currentStep, currentIndex, timeRemaining, integrityScore, flags } = engineState;

  // Local Data State
  const [jobProfile, setJobProfile] = useState(null);
  const [showDisclosure, setShowDisclosure] = useState(true);

  const [loading, setLoading] = useState(true);
  const [skillQuestions, setSkillQuestions] = useState([]);
  const [psychQuestions, setPsychQuestions] = useState([]);

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("selectedProfile");
      if (!stored) return navigate("/profile-selection");
      const p = JSON.parse(stored);
      setJobProfile(p);

      try {
        const [r1, r2] = await Promise.all([
          generateQuestions(p.id, "medium", 20),
          generateQuestions("psychology-assessment", "medium", 10)
        ]);
        setSkillQuestions(r1.data.questions || []);
        setPsychQuestions(r2.data.questions || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, [navigate]);

  // Sync Questions to Engine when Step Changes
  useEffect(() => {
    if (currentStep === 'skill' && skillQuestions.length > 0) {
      actions.setQuestions(skillQuestions);
      actions.startTest(1800); // Start timer
    } else if (currentStep === 'psych' && psychQuestions.length > 0) {
      actions.setQuestions(psychQuestions);
    }
  }, [currentStep, skillQuestions, psychQuestions, actions]);

  // Map old flowStep integers to new string steps for rendering
  const stepMap = {
    'intro': 0, 'gate': 0,
    'device': 1,
    'video': 2,
    'skill': 3,
    'vision': 4,
    'reflex': 5,
    'memory': 6,
    'psych': 7,
    'result': 8
  };
  const flowStep = stepMap[currentStep] ?? 0;


  // Reference to webcam video element for frame capture
  const webcamRef = useRef(null);
  const sessionIdRef = useRef(`test_${Date.now()}`);
  const [deviceAlerts, setDeviceAlerts] = useState([]);

  // Continuous Device Monitoring
  useEffect(() => {
    if (flowStep < 3) return; // Only monitor during actual test
    // if (flowStep === 4) return; // Keep monitoring during reflex test

    // Function to capture frame from webcam
    const captureFrame = async () => {
      const video = webcamRef.current;
      // Mobile support: readyState >= 2 (HAVE_CURRENT_DATA) is sufficient for frame capture
      if (!video || video.readyState < 2) return null;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
      });
    };

    // Function to analyze frame
    const analyzeFrame = async () => {
      try {
        const frameBlob = await captureFrame();
        if (!frameBlob) return;

        const formData = new FormData();
        formData.append('frame', frameBlob, 'frame.jpg');
        formData.append('sessionId', sessionIdRef.current);
        formData.append('questionNumber', currentIndex + 1);
        formData.append('timestamp', Date.now());

        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/analyze-frame`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success && !data.analysis.clean) {
          // Device detected!
          const deviceFlag = `Device Detected: ${data.analysis.devicesFound.join(', ')}`;
          actions.flagIntegrity(deviceFlag, data.integrityPenalty);
          setDeviceAlerts(prev => [...prev, {
            type: data.analysis.devicesFound,
            reason: data.analysis.flagReason,
            riskLevel: data.analysis.riskLevel,
            time: new Date().toLocaleTimeString()
          }]);
          console.warn(`Device Alert: ${data.analysis.flagReason}`);
        }
      } catch (err) {
        console.error("Frame analysis error:", err);
      }
    };

    // Analyze frame every 30 seconds during test
    const frameInterval = setInterval(analyzeFrame, 30000);

    // Also analyze immediately when test starts
    setTimeout(analyzeFrame, 5000);

    return () => clearInterval(frameInterval);
  }, [flowStep, currentIndex]);

  // Audio stream reference for voice monitoring
  const audioStreamRef = useRef(null);
  const [voiceAlerts, setVoiceAlerts] = useState([]);

  // Continuous Voice Monitoring
  useEffect(() => {
    if (flowStep < 3) return; // Only monitor during actual test
    // if (flowStep === 4) return; // Keep monitoring during reflex test

    let audioRecorder = null;
    let audioChunks = [];

    // Initialize audio stream
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
      } catch (err) {
        console.warn("Audio monitoring unavailable:", err.message);
      }
    };

    // Record 5-second audio clip and send for analysis
    const recordAndAnalyze = async () => {
      if (!audioStreamRef.current) return;

      try {
        audioChunks = [];

        // Check for supported MIME type (Safari uses mp4, Chrome/FF use webm)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        audioRecorder = new MediaRecorder(audioStreamRef.current, { mimeType });

        audioRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        audioRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: mimeType });

          // Send to backend for analysis
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, `audio.${mimeType === 'audio/webm' ? 'webm' : 'mp4'}`);
            formData.append('sessionId', sessionIdRef.current);
            formData.append('questionNumber', currentIndex + 1);
            formData.append('isQuickCheck', 'true');

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/analyze-audio`, {
              method: 'POST',
              body: formData
            });

            const data = await response.json();

            if (data.success && !data.analysis.clean) {
              // Voice anomaly detected!
              const voiceFlag = `Voice Alert: ${data.analysis.suspiciousActivity}`;
              actions.flagIntegrity(voiceFlag, data.analysis.integrityPenalty);
              setVoiceAlerts(prev => [...prev, {
                type: data.analysis.suspiciousActivity,
                reason: data.analysis.reason,
                voiceCount: data.analysis.voiceCount,
                time: new Date().toLocaleTimeString()
              }]);
              console.warn(`Voice Alert: ${data.analysis.reason}`);
            }
          } catch (err) {
            console.error("Audio analysis error:", err);
          }
        };

        // Record for 5 seconds
        audioRecorder.start();
        setTimeout(() => {
          if (audioRecorder && audioRecorder.state === "recording") {
            audioRecorder.stop();
          }
        }, 5000);

      } catch (err) {
        console.error("Audio recording error:", err);
      }
    };

    // Initialize audio
    initAudio();

    // Analyze audio every 20 seconds
    const audioInterval = setInterval(recordAndAnalyze, 20000);

    // First check after 10 seconds
    setTimeout(recordAndAnalyze, 10000);

    return () => {
      clearInterval(audioInterval);
      // Proper cleanup of recorder
      if (audioRecorder && audioRecorder.state === "recording") {
        audioRecorder.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [flowStep, currentIndex]);

  // State for AI tool detection
  const [aiToolRisk, setAiToolRisk] = useState('low');
  const questionStartTimeRef = useRef(Date.now());

  // Anti-Cheat (Enhanced Tab Switching & AI Tool Detection)
  const lastSwitchTime = useRef(0);

  useEffect(() => {
    if (flowStep < 3) return; // Only monitor during actual test
    // if (flowStep === 4) return; // Keep monitoring during reflex test

    const logFlag = (flag, deduction) => {
      actions.flagIntegrity(flag, deduction);
    };

    // Enhanced tab switch with backend logging for AI detection
    const handleVisibilityChange = async () => {
      const now = Date.now();
      // Debounce: Ignore switches within 500ms of the last one
      if (now - lastSwitchTime.current < 500) return;
      lastSwitchTime.current = now;

      const type = document.hidden ? 'leave' : 'return';

      // Local flag
      if (document.hidden) {
        logFlag("Tab Switch Detected", 5);
      }

      // Log to backend for AI tool pattern detection
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/log-tab-switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            type,
            questionNumber: currentIndex + 1,
            timestamp: now
          })
        });

        const data = await response.json();
        if (data.success) {
          setAiToolRisk(data.currentRisk);

          // Apply additional penalty if AI tool suspected
          if (data.currentRisk === 'high' || data.currentRisk === 'critical') {
            logFlag(`AI Tool Suspicion: ${data.currentRisk}`, data.integrityPenalty);
          }
        }
      } catch (err) {
        console.error("Tab switch logging failed:", err);
      }
    };

    const handleBlur = () => logFlag("Focus Lost", 2);

    // Paste event detection
    const handlePaste = async (e) => {
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const textLength = pastedText?.length || 0;

      // Ignore empty pastes
      if (!pastedText || textLength === 0) return;

      logFlag("Paste Detected", textLength > 100 ? 10 : 3);

      // Log to backend
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/log-paste`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            questionNumber: currentIndex + 1,
            textLength,
            timestamp: Date.now()
          })
        });

        const data = await response.json();
        if (data.success && data.currentRisk !== 'low') {
          setAiToolRisk(data.currentRisk);
        }
      } catch (err) {
        console.error("Paste logging failed:", err);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("paste", handlePaste);

    // Timer handled by engine
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("paste", handlePaste);
    };
  }, [flowStep, currentIndex]);

  // Track question start time for answer timing analysis
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  const handleAnswer = async (choice) => {
    const isSkill = flowStep === 3;
    const isPsych = flowStep === 7;
    const qList = isSkill ? skillQuestions : psychQuestions;
    const currentQ = qList[currentIndex];
    const timeOnQuestion = Date.now() - questionStartTimeRef.current;

    // Determine if answer is correct
    // For skill questions: compare choice index with correctAnswer
    // For psych questions: they don't have correctAnswer, just scores
    let isCorrect = false;
    let selectedOption = null;
    let userAnswerValue = null;

    if (isSkill && currentQ.options) {
      // Skill question - find which option was selected
      selectedOption = currentQ.options.findIndex(opt => opt === (choice.text || choice));
      userAnswerValue = selectedOption;
      isCorrect = selectedOption === currentQ.correctAnswer;
    } else {
      // Psych question - use score-based approach
      userAnswerValue = choice.text || choice;
      selectedOption = choice.text || choice;
      // Psych questions don't have a "correct" answer, but higher scores are better
      isCorrect = (choice.score || 0) >= 7; // Consider answers with score >= 7 as "good"
    }

    // Store comprehensive answer data
    const answerData = {
      _id: currentQ._id || currentQ.id,
      questionId: currentQ._id || currentQ.id,
      question: currentQ.question,
      questionText: currentQ.question,
      userAnswer: userAnswerValue,
      selectedOption: selectedOption,
      correctAnswer: currentQ.correctAnswer,
      isCorrect: isCorrect,
      score: isSkill ? (isCorrect ? 10 : 0) : (choice.score || 0),
      topic: currentQ.topic || (isSkill ? "Skill Assessment" : "Psychology"),
      domain: isSkill ? "Skill" : "Psychology",
      timestamp: Date.now(),
      timeSpent: Math.floor(timeOnQuestion / 1000) // Convert to seconds
    };

    actions.answerQuestion(currentQ._id || currentQ.id, answerData);

    // Log answer timing
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/intelligence/log-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          questionNumber: currentIndex + 1,
          timeOnQuestion,
          timestamp: Date.now()
        })
      });

      // NEW: Log to Telemetry (for behavioral analysis)
      if (logEvent) {
        logEvent('answer_submit', {
          question_id: currentQ._id || currentQ.id,
          response_time_ms: timeOnQuestion
        });
      }

    } catch (err) { console.debug("Answer log failed", err); }

    if (currentIndex + 1 < qList.length) {
      actions.nextQuestion();
    } else {
      // Stage Complete
      if (isSkill) {
        actions.changeStep('vision');
      } else if (isPsych) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    // Calculate preliminary score from engine state
    const answersList = Object.values(engineState.answers);
    const totalQuestions = answersList.length;
    const correctAnswers = answersList.filter(a => a.isCorrect).length;
    const preliminaryScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    navigate("/result", {
      state: {
        answers: answersList,
        difficulty: "medium",
        jobProfile: jobProfile.id,
        sessionId: sessionIdRef.current, // Include session ID
        finalScore: preliminaryScore, // Preliminary client-side score
        meta: {
          integrityScore,
          cheatingFlags: flags,
          timeLeft: timeRemaining,
          timeTaken: 1800 - timeRemaining,
          reactionTimes: engineState.reactionTimes,
          memoryScore: engineState.memoryScore,
          visionScore: engineState.visionScore,
          reflexData: engineState.reflexData || null, // Pass reflex metrics
          videoBlob: true // Indicate video was recorded
        }
      }
    });
  };

  if (loading) return <Loader text="Initializing Secure Environment..." />;

  return (
    <div className="test-container">
      {/* Duplicate ProctorMonitor removed from here */}

      {/* Research Disclosure (Runs first) */}
      {flowStep === 0 && showDisclosure && (
        <ResearchDisclosureModal onAnalyze={() => setShowDisclosure(false)} />
      )}

      {/* Existing flow... hiding Gate until disclosure accepted */}
      {flowStep === 0 && !showDisclosure && <FullScreenGate onEnter={() => actions.changeStep('device')} />}

      {flowStep === 1 && <DeviceCheck onComplete={() => actions.changeStep('video')} />}

      {flowStep === 2 && <IntroductionRecorder onComplete={() => actions.changeStep('skill')} />}

      {flowStep === 4 && (
        <VisionTest onComplete={(score) => {
          actions.setVisionScore(score);
          actions.changeStep('reflex');
        }} />
      )}

      {flowStep === 5 && (
        <ReflexTest onComplete={(metrics) => {
          actions.recordReaction(metrics.reactionTimeMs);
          actions.setReflexMetrics(metrics);
          actions.changeStep('memory');
        }} />
      )}

      {flowStep === 6 && (
        <MemoryTest onComplete={(score) => {
          actions.setMemoryScore(score);
          actions.changeStep('psych');
        }} />
      )}



      {(flowStep === 3 || flowStep === 7) && (
        <>
          {/* Proctor Monitor (Always visible during active testing) */}
          <ProctorMonitor
            integrityScore={integrityScore}
            webcamRef={webcamRef}
            deviceAlerts={deviceAlerts}
            voiceAlerts={voiceAlerts}
          />

          {/* Modular Question Section */}
          <QuestionSection
            stageTitle={flowStep === 3 ? "Stage 1/4: Skill Assessment" : "Stage 4/4: Psychology Evaluation"}
            question={(flowStep === 3 ? skillQuestions : psychQuestions)[currentIndex]}
            questionIndex={currentIndex}
            totalQuestions={(flowStep === 3 ? skillQuestions : psychQuestions).length}
            onAnswer={handleAnswer}
            integrityScore={integrityScore}
            aiToolRisk={aiToolRisk}
            timer={timeRemaining}
          />
        </>
      )}
    </div>
  );
}

export default Test;
