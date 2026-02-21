export async function generateMetadata({ params }) {
  const { slug } = params;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

  // Fetch result data for metadata
  let title = "The Senses — Intelligence Ranking";
  let description = "AI-evaluated intelligence ranking";

  try {
    const res = await fetch(`${apiBase}/api/intelligence/result/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        title = data.result.share?.headline || title;
        description = data.result.profile?.summary || description;
      }
    }
  } catch (err) {
    console.error("Failed to fetch metadata:", err);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `${apiBase}/og/${slug}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${apiBase}/og/${slug}.png`],
    },
  };
}
