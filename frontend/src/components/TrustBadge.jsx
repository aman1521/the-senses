import React from 'react';
import { getTrustColor, getTrustBgColor } from '../lib/core';

const TrustBadge = ({ trust }) => {
    const { level, score, label, isVerified } = trust;

  const color = getTrustColor(score);
  const bgColor = getTrustBgColor(score);

    return (
        <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: bgColor }}
        >
            {/* Shield Icon */}
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 2L4 6V12C4 16.5 7 20.5 12 22C17 20.5 20 16.5 20 12V6L12 2Z"
                    fill={color}
                    opacity="0.2"
                />
                <path
                    d="M12 2L4 6V12C4 16.5 7 20.5 12 22C17 20.5 20 16.5 20 12V6L12 2Z"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Trust Score */}
            <span style={{ color, fontWeight: '600', fontSize: '14px' }}>
                {score}%
            </span>

            {/* Verified Checkmark */}
            {isVerified && (
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="12" cy="12" r="10" fill={color} />
                    <path
                        d="M8 12L11 15L16 9"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </div>
    );
};

export default TrustBadge;
