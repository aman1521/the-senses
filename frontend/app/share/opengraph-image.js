import { getSession } from "@/lib/session";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  // NOTE: In production, this should fetch via slug
  // For now, we generate a generic high-status card

  return new Response(
    `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b0b0b"/>
          <stop offset="100%" stop-color="#121212"/>
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#bg)" />

      <text x="80" y="160" fill="#00ffd5" font-size="42" font-weight="700">
        THE SENSES
      </text>

      <text x="80" y="260" fill="#ffffff" font-size="72" font-weight="800">
        Top Performers Only
      </text>

      <text x="80" y="340" fill="#cccccc" font-size="36">
        AI-Evaluated Intelligence Ranking
      </text>

      <text x="80" y="460" fill="#888888" font-size="28">
        Think better. Rank higher.
      </text>
    </svg>
    `,
    {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    }
  );
}
