"use client";

import { useEffect, useState } from "react";
import { getSession, clearSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const session = getSession();

    if (!session || !session.result) {
      router.push("/");
      return;
    }

    setResult(session.result);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-white text-xl font-semibold">Analyzing your intelligence profile...</p>
            <p className="text-zinc-400 text-sm">Processing cognitive patterns and ranking data</p>
          </div>
        </div>
      </div>
    );
  }

  const { profile, rank, share } = result;

  // Extract badge information (if available from backend)
  const badge = rank.badge || {};
  const tierEmoji = badge.emoji || rank.emoji || "🎯";
  const tierName = badge.name || rank.tier || "Ranked";
  const tierColor = badge.color || "#6366F1";

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Tier Hero Section - Designed for Screenshots/Sharing */}
        <section className="relative overflow-hidden rounded-2xl border-2 p-8 text-center"
          style={{
            borderColor: tierColor,
            background: `linear-gradient(135deg, ${tierColor}15 0%, transparent 100%)`
          }}
        >
          {/* Tier Badge */}
          <div className="mb-4">
            <div className="text-8xl mb-4">{tierEmoji}</div>
            <div className="text-5xl font-bold mb-2" style={{ color: tierColor }}>
              {tierName}
            </div>
            <div className="text-zinc-400 text-lg">
              {badge.description || `Top ${100 - rank.globalPercentile}% globally`}
            </div>
          </div>

          {/* Percentile */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="text-zinc-400 text-sm mb-2">Your Percentile</div>
            <div className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {rank.globalPercentile}%
            </div>
            <div className="text-zinc-400 mt-2">
              You outperformed <span className="text-white font-semibold">{rank.globalPercentile}%</span> of all participants
            </div>
          </div>

          {/* Status Message */}
          {badge.shareText && (
            <div className="mt-6 text-zinc-300 text-lg font-medium">
              {badge.shareText}
            </div>
          )}
        </section>

        {/* Intelligence Profile */}
        <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-2xl font-bold mb-2">{profile.thinkingStyle}</h2>
          <p className="text-zinc-400 mb-6">{profile.summary}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-green-400">✓ Strengths</h4>
              <ul className="space-y-2">
                {profile.strengths.map((s) => (
                  <li key={s} className="text-zinc-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cognitive Biases */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-amber-400">⚠ Watch For</h4>
              <ul className="space-y-2">
                {profile.cognitiveBiases.map((b) => (
                  <li key={b} className="text-zinc-300 flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(`/share/${share.slug}`)}
            className="flex-1 bg-white text-black py-4 px-6 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-colors"
          >
            Share My Rank →
          </button>

          <button
            onClick={() => {
              clearSession();
              router.push("/rank");
            }}
            className="flex-1 bg-zinc-800 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            View Global Rankings
          </button>
        </section>

        {/* Subtle CTA */}
        <div className="text-center text-zinc-500 text-sm">
          Want to improve your rank? Retake the test in 24 hours
        </div>
      </div>
    </main>
  );
}
