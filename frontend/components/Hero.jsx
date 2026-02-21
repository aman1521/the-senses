"use client";

import CTAButton from "./CTAButton";

export default function Hero() {
  return (
    <section className="hero">
      <div className="content">

        <span className="pill">AI-Powered Intelligence Ranking</span>

        <h1>
          Discover Your <br />
          <span>Real Intelligence</span>
        </h1>

        <p>
          An AI-driven assessment that analyzes how you think,
          compares you globally, and ranks you within your field.
        </p>

        <CTAButton />

        <p className="sub">
          Used by professionals, founders, and strategists.
        </p>

      </div>
    </section>
  );
}
