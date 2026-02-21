"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/services/authService";
import { useNavigate } from "react-router-dom";

export default function AuthGuard({ children }) {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getMe()
            .then(() => {
                setAuthorized(true);
                setLoading(false);
            })
            .catch(() => {
                setAuthorized(false);
                setLoading(false);
                navigate("/login");
            });
    }, [navigate]);

    if (loading) return <div className="p-8 text-white text-center">Checking authorization…</div>;

    return authorized ? children : null;
}
