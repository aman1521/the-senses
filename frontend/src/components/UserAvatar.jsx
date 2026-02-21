import React, { useMemo } from 'react';

const UserAvatar = ({ name, url, size = 48, className = "" }) => {
    // Deterministic color generation based on name
    const bgColor = useMemo(() => {
        if (!name) return '#333';
        const colors = [
            'linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)',   // Red
            'linear-gradient(135deg, #4DADF7 0%, #1971C2 100%)',   // Blue
            'linear-gradient(135deg, #69DB7C 0%, #2B8A3E 100%)',   // Green
            'linear-gradient(135deg, #FFD43B 0%, #F08C00 100%)',   // Yellow
            'linear-gradient(135deg, #B197FC 0%, #6741D9 100%)',   // Purple
            'linear-gradient(135deg, #FF922B 0%, #D9480F 100%)',   // Orange
            'linear-gradient(135deg, #20C997 0%, #087F5B 100%)',   // Teal
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }, [name]);

    const initials = useMemo(() => {
        if (!name) return '?';
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);

    return (
        <div
            className={`relative rounded-full border border-white/10 shadow-lg flex items-center justify-center overflow-hidden ${className}`}
            style={{
                width: size,
                height: size,
                minWidth: size,
                background: url ? '#000' : bgColor,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {url ? (
                <img
                    src={url}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            ) : (
                <span style={{
                    color: 'white',
                    fontSize: size * 0.4,
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                    {initials}
                </span>
            )}

            {/* Glossy overlay effect to make it look premium */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none'
                }}
            />
        </div>
    );
};

export default UserAvatar;
