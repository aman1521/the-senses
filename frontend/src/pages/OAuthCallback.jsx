import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Processing...");

    useEffect(() => {
        const token = searchParams.get("token");
        const userId = searchParams.get("userId");
        const userName = searchParams.get("userName");
        const profileType = searchParams.get("profileType");
        const error = searchParams.get("error");

        if (error) {
            setStatus("Authentication failed. Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        if (token && userId) {
            // Store auth data
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userName", userName || "User");
            localStorage.setItem("userProfileType", profileType || "");

            setStatus("Success! Redirecting...");
            setTimeout(() => navigate("/"), 1000);
        } else {
            setStatus("Invalid callback. Redirecting...");
            setTimeout(() => navigate("/login"), 2000);
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#888', fontSize: '14px' }}>{status}</p>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuthCallback;
