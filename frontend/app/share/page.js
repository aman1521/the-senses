export const metadata = {
  title: "The Senses — Intelligence Ranking",
  description: "AI-evaluated intelligence ranking and thinking profile.",
};

"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { useRouter } from "next/navigation";

export default function SharePage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    const session = getSession();

    if (!session || !session.result) {
      router.push("/");
      return;
    }

    setData(session.result);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-white text-xl font-semibold">Preparing your share card...</p>
            <p className="text-zinc-400 text-sm">Generating shareable content</p>
          </div>
        </div>
      </div>
    );
  }

  const { profile, rank, share } = data;

  // Extract badge information
  const badge = rank.badge || {};
  const tierEmoji = badge.emoji || rank.emoji || "🎯";
  const tierName = badge.name || rank.tier || "Ranked";
  const tierColor = badge.color || "#6366F1";
  const shareText = badge.shareText || `${tierName} — Top ${100 - rank.globalPercentile}%`;

  // Platform-specific share text
  const twitterText = `${tierEmoji} ${shareText}\n\nThe Senses — Intelligence Ranking\n\nThink you can beat this?`;
  const linkedInText = `I just completed The Senses intelligence evaluation and ranked as ${tierName} (${rank.globalPercentile}th percentile). ${badge.description || 'Cognitive performance assessment'} #TheSenses #AI`;

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(`${twitterText}\n${shareUrl}`);
    alert("Share text copied to clipboard!");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">

        {/* Share Card - Designed for Screenshots */}
        <section
          className="relative overflow-hidden rounded-3xl border-2 p-12 text-center"
          style={{
            borderColor: tierColor,
            background: `radial-gradient(circle at top, ${tierColor}20 0%, transparent 70%)`
          }}
        >
          {/* Minimal Branding */}
          <div className="absolute top-4 right-4 text-zinc-600 text-xs font-mono">
            THE SENSES
          </div>

          {/* Tier Display - BIG and BOLD */}
          <div className="space-y-6">
            <div className="text-9xl">{tierEmoji}</div>

            <div>
              <div className="text-6xl font-black mb-3" style={{ color: tierColor }}>
                {tierName}
              </div>
              <div className="text-zinc-500 text-lg">
                {badge.description || `Top ${100 - rank.globalPercentile}%`}
              </div>
            </div>

            {/* Percentile - Huge Number */}
            <div className="pt-8 border-t border-zinc-800">
              <div className="text-8xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {rank.globalPercentile}%
              </div>
            </div>
          </div>

          {/* No explanations - just status */}
        </section>

        {/* Share Buttons */}
        <div className="space-y-3">
          <button
            onClick={shareTwitter}
            className="w-full bg-[#1DA1F2] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-3"
          >
            <span>𝕏</span>
            Share on Twitter
          </button>

          <button
            onClick={shareLinkedIn}
            className="w-full bg-[#0A66C2] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#004182] transition-colors flex items-center justify-center gap-3"
          >
            <span>in</span>
            Share on LinkedIn
          </button>

          <button
            onClick={copyToClipboard}
            className="w-full bg-zinc-800 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            📋 Copy Share Text
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => router.push("/rank")}
            className="flex-1 text-zinc-400 hover:text-white transition-colors py-3"
          >
            View Rankings
          </button>
          <button
            onClick={() => router.push("/test")}
            className="flex-1 text-zinc-400 hover:text-white transition-colors py-3"
          >
            Retake Test
          </button>
        </div>
      </div>
    </main>
  );
}
