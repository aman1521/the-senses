"use client";

import { useState } from "react";
import { login } from "@/services/authService";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const submit = async () => {
        await login({ email, password });
        navigate("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="bg-zinc-900 p-8 rounded-xl w-96 space-y-4">
                <h1 className="text-2xl font-bold text-white">Login</h1>

                <input
                    className="w-full p-3 bg-zinc-800 rounded text-white"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    className="w-full p-3 bg-zinc-800 rounded text-white"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={submit}
                    className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                >
                    Login
                </button>
            </div>
        </div>
    );
}
