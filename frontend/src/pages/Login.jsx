import { useState, useEffect } from "react";
import { API, resolveApiBaseURL } from "../services/api";
import { useNavigate } from "react-router-dom";
import { JOB_PROFILES } from "../data/jobProfiles";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState(null);
    const [oauthStatus, setOauthStatus] = useState({ google: false, linkedin: false });
    const [accessType, setAccessType] = useState('talent'); // 'talent' or 'company'

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        companyName: "",
        profileType: "software-engineer",
        experienceLevel: "mid"
    });

    const [error, setError] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
    const apiBaseURL = resolveApiBaseURL();

    // Check OAuth availability on mount
    useEffect(() => {
        API.get("/api/v1/auth/oauth-status")
            .then(res => setOauthStatus(res.data))
            .catch(() => setOauthStatus({ google: false, linkedin: false }));
    }, []);

    // Password Strength Checker
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        const levels = [
            { label: "Very Weak", color: "#ef4444" },
            { label: "Weak", color: "#f97316" },
            { label: "Fair", color: "#eab308" },
            { label: "Good", color: "#22c55e" },
            { label: "Strong", color: "#10b981" },
            { label: "Very Strong", color: "#06b6d4" }
        ];

        setPasswordStrength({ score, ...levels[Math.min(score, 5)] });
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setFormData({ ...formData, password: newPassword });
        if (isRegister) {
            checkPasswordStrength(newPassword);
        }
    };

    const checkClaimableScore = () => {
        return localStorage.getItem("senses_claim_session");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Frontend password validation for registration
        if (isRegister) {
            if (formData.password.length < 8) {
                setError("Password must be at least 8 characters long");
                return;
            }
            if (passwordStrength.score < 2) {
                setError("Please choose a stronger password (include uppercase, numbers, or symbols)");
                return;
            }
        }

        try {
            const claimSessionId = checkClaimableScore();

            if (isRegister) {
                await API.post("/api/v1/auth/register", {
                    ...formData,
                    role: accessType === 'company' ? 'company_admin' : 'user', // Set role
                    claimSessionId
                });

                if (claimSessionId) localStorage.removeItem("senses_claim_session");

                setIsRegister(false);
                setError(null);
                alert("Identity Established! Please login to access your portal.");
            } else {
                const res = await API.post("/api/v1/auth/login", {
                    email: formData.email,
                    password: formData.password
                });

                localStorage.setItem("token", res.data.token);
                localStorage.setItem("userId", res.data.user._id);
                localStorage.setItem("userName", res.data.user.name);
                localStorage.setItem("userRole", res.data.user.role); // Store role
                localStorage.setItem("userTrust", res.data.user.trustScore || 100);
                localStorage.setItem("userProfileType", res.data.user.profileType || "");

                // Redirect based on role
                if (res.data.user.role === 'company_admin' || res.data.user.role === 'admin') {
                    navigate("/company");
                } else {
                    // Redirect based on onboarding status
                    if (res.data.user.onboardingCompleted === false) {
                        navigate("/onboarding");
                    } else {
                        navigate("/");
                    }
                }
            }

        } catch (err) {
            const isNetworkFailure = err.code === "ERR_NETWORK" || !err.response;
            if (isNetworkFailure) {
                setError("Unable to connect to the server. Please try again in a moment.");
                return;
            }

            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Authentication failed";
            setError(errorMsg);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotMessage(null);

        try {
            await API.post("/api/v1/auth/forgot-password", { email: forgotEmail });
            setForgotMessage({ type: "success", text: "Password reset link sent to your email!" });
        } catch (err) {
            setForgotMessage({
                type: "error",
                text: err.response?.data?.error || err.response?.data?.details || "Failed to send reset link"
            });
        }
    };

    // OAuth Handlers
    const handleGoogleLogin = () => {
        const googleAuthUrl = `${apiBaseURL}/api/v1/auth/google`;
        window.location.href = googleAuthUrl;
    };

    const handleLinkedInLogin = () => {
        const linkedInAuthUrl = `${apiBaseURL}/api/v1/auth/linkedin`;
        window.location.href = linkedInAuthUrl;
    };

    // Group profiles by Category
    const groupedProfiles = JOB_PROFILES.reduce((acc, profile) => {
        if (!acc[profile.category]) acc[profile.category] = [];
        acc[profile.category].push(profile);
        return acc;
    }, {});

    // Forgot Password Modal
    if (showForgotPassword) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h1>Reset Password</h1>
                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {forgotMessage && (
                        <div className={`message-box ${forgotMessage.type}`}>
                            {forgotMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                        />
                        <button className="primary-button" type="submit">
                            Send Reset Link
                        </button>
                    </form>

                    <p className="switch-mode" onClick={() => setShowForgotPassword(false)}>
                        ← Back to Login
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Access Type Toggles */}
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${accessType === 'talent' ? 'bg-white text-black' : 'bg-transparent text-zinc-500 border border-zinc-700'}`}
                        onClick={() => { setAccessType('talent'); setError(null); }}
                    >
                        Talent Access
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${accessType === 'company' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-zinc-500 border border-zinc-700'}`}
                        onClick={() => { setAccessType('company'); setError(null); }}
                    >
                        Company Access
                    </button>
                </div>

                <h1>
                    {accessType === 'company'
                        ? (isRegister ? "Register Company" : "Company Portal")
                        : (isRegister ? "Join Verified Network" : "Neural Link Access")}
                </h1>

                {error && <div className="error-box">{error}</div>}

                {/* OAuth Buttons - Only show for Talent */}
                {accessType === 'talent' && (oauthStatus.google || oauthStatus.linkedin) && (
                    <>
                        <div className="oauth-buttons">
                            {/* ... existing OAuth buttons ... */}
                            {oauthStatus.google && (
                                <button type="button" className="oauth-btn google-btn" onClick={handleGoogleLogin}>
                                    <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                    Continue with Google
                                </button>
                            )}
                            {oauthStatus.linkedin && (
                                <button type="button" className="oauth-btn linkedin-btn" onClick={handleLinkedInLogin}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                    Continue with LinkedIn
                                </button>
                            )}
                        </div>
                        <div className="divider"><span>or</span></div>
                    </>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <input
                                type="text"
                                placeholder={accessType === 'company' ? "Admin Full Name" : "Full Name"}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            {/* Company Specific Input */}
                            {accessType === 'company' && (
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    required
                                />
                            )}

                            {/* Talent Specific Inputs */}
                            {accessType === 'talent' && (
                                <>
                                    <select
                                        value={formData.profileType}
                                        onChange={e => setFormData({ ...formData, profileType: e.target.value })}
                                        className="profile-select"
                                    >
                                        {Object.keys(groupedProfiles).map(category => (
                                            <optgroup key={category} label={category}>
                                                {groupedProfiles[category].map(profile => (
                                                    <option key={profile.id} value={profile.id}>
                                                        {profile.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>

                                    <select
                                        value={formData.experienceLevel || "mid"}
                                        onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })}
                                        className="profile-select"
                                    >
                                        <option value="intern">Intern / Student (0-1 years)</option>
                                        <option value="junior">Junior (1-3 years)</option>
                                        <option value="mid">Mid-Level (3-5 years)</option>
                                        <option value="senior">Senior (5-8 years)</option>
                                        <option value="executive">Executive / Expert (8+ years)</option>
                                    </select>
                                </>
                            )}
                        </>
                    )}

                    <input
                        type="email"
                        placeholder={accessType === 'company' ? "Work Email" : "Email Address"}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    {/* Password with Show/Hide Toggle */}
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handlePasswordChange}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                        </button>
                    </div>

                    {/* Password Strength (Register Only) */}
                    {isRegister && formData.password && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div className="strength-fill" style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }} />
                            </div>
                            <span style={{ color: passwordStrength.color, fontSize: '12px' }}>{passwordStrength.label}</span>
                        </div>
                    )}

                    {/* Password Hints */}
                    {isRegister && (
                        <div className="password-hints">
                            <span className={formData.password.length >= 8 ? 'valid' : ''}>• 8+ chars</span>
                            <span className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>• Uppercase</span>
                            <span className={/\d/.test(formData.password) ? 'valid' : ''}>• Number</span>
                            <span className={/[!@#$%^&*]/.test(formData.password) ? 'valid' : ''}>• Symbol</span>
                        </div>
                    )}

                    <button className="primary-button" type="submit">
                        {isRegister ? (accessType === 'company' ? "Create Company Account" : "Initialize Identity") : (accessType === 'company' ? "Enter Portal" : "Connect")}
                    </button>
                </form>

                {/* Forgot Password Link */}
                {!isRegister && (
                    <p className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                        Forgot your password?
                    </p>
                )}

                <p className="switch-mode" onClick={() => { setIsRegister(!isRegister); setError(null); }}>
                    {isRegister ? (accessType === 'company' ? "Already have an account? Login" : "Already verified? Login") : (accessType === 'company' ? "New Company? Register" : "Need an identity? Register")}
                </p>
            </div>
        </div>
    );
};

export default Login;
