import React from 'react';

const TierBadge = ({ badge }) => {
    const { emoji, name, color } = badge;

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
                backgroundColor: `${color}15`,
                border: `1px solid ${color}40`,
            }}
        >
            <span style={{ fontSize: '18px' }}>{emoji}</span>
            <span style={{ color, fontWeight: '600', fontSize: '14px' }}>
                {name}
            </span>
        </div>
    );
};

export default TierBadge;
