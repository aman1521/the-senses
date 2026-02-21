"use client";

import { useRouter } from "next/navigation";

export default function CTAButton() {
  const router = useRouter();

  return (
    <button
      className="cta"
      onClick={() => router.push("/profile-selection")}
    >
      Analyze My Intelligence →
    </button>
  );
}
