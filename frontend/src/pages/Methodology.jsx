import { useNavigate } from "react-router-dom";

function Methodology() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-24 font-sans selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto space-y-24">

                {/* Hero Section */}
                <section className="text-center space-y-8 animate-fade-in-up">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Transparency Report v2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-600 leading-tight">
                        Quantifying<br />Human Potential.
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        The Senses isn't just a quiz. It's a verified signal of cognitive capability, backed by AI-driven psychometrics and military-grade integrity protocols.
                    </p>
                </section>

                {/* 01. The Tiers */}
                <section>
                    <SectionHeader number="01" title="The Evaluation Scale" color="text-indigo-500" />
                    <p className="text-zinc-400 mb-8 max-w-2xl">
                        Scores are distributed across a normal distribution curve. Achieving an "Outlier" status requires performing
                        in the top 1% of all verified test-takers globally.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TierCard
                            name="Observer"
                            percentile="Bottom 40%"
                            desc="Foundational thinkers who learn through observation. Represents the starting point of the cognitive journey."
                            color="text-zinc-500"
                            bg="bg-zinc-900/40"
                        />
                        <TierCard
                            name="Analyst"
                            percentile="40th - 65th"
                            desc="Capable problem solvers. Can dissect complex information and identify clear patterns in structured data."
                            color="text-indigo-400"
                            bg="bg-indigo-950/20"
                        />
                        <TierCard
                            name="Strategist"
                            percentile="65th - 85th"
                            desc="High-level thinkers who connect disparate dots. They don't just solve problems; they foresee them."
                            color="text-purple-400"
                            bg="bg-purple-950/20"
                        />
                        <TierCard
                            name="Elite Mind"
                            percentile="85th - 95th"
                            desc="Superior processing speed and accuracy. These individuals digest information faster than 90% of the population."
                            color="text-cyan-400"
                            bg="bg-cyan-950/20"
                        />
                        <TierCard
                            name="Top 1%"
                            percentile="95th - 99th"
                            desc="Exceptional cognitive density. Rare talent capable of effortless high-stakes decision making."
                            color="text-emerald-400"
                            bg="bg-emerald-950/20"
                        />
                        <TierCard
                            name="Outlier"
                            percentile="Top 0.1%"
                            desc="Statistically significant deviation. The bleeding edge of human potential. A verified genius-level signal."
                            color="text-amber-400"
                            bg="bg-amber-950/20 border-amber-500/20"
                            glow="shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)]"
                        />
                    </div>
                </section>

                {/* 02. The Integrity Protocol */}
                <section>
                    <SectionHeader number="02" title="Verification & Integrity" color="text-emerald-500" />
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
                        <p className="text-lg text-zinc-300 mb-8 max-w-3xl">
                            A high score is meaningless without proof. We utilize a multi-modal AI surveillance system to ensure every
                            result is legitimate. Cheating doesn't just fail the test; it permanently flags the user profile.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <Feature
                                icon="fa-mobile-screen"
                                title="Digital Device Detection"
                                desc="Our computer vision models analyze 300+ frames per minute to detect unauthorized devices (phones, tablets) or secondary screens in the environment."
                            />
                            <Feature
                                icon="fa-robot"
                                title="Behavioral Fingerprinting"
                                desc="We analyze typing cadence, cursor micro-movements, and tab-switching patterns to detect usage of LLMs (ChatGPT, Claude) or copy-paste actions."
                            />
                            <Feature
                                icon="fa-microphone-lines"
                                title="Voice Pattern Analysis"
                                desc="Audio streams are monitored for coaching, multiple voices, or background dictation, ensuring the candidate is working strictly alone."
                            />
                            <Feature
                                icon="fa-fingerprint"
                                title="Identity Lock"
                                desc="Video introductions are cross-referenced with webcam sessions to prevent impersonation. The person who starts the test must be the one who finishes it."
                            />
                        </div>
                    </div>
                </section>

                {/* 03. The Science */}
                <section>
                    <SectionHeader number="03" title="The Psychometrics" color="text-rose-500" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <h3 className="text-2xl font-bold text-white">Adaptive Difficulty (IRT)</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Unlike static tests, The Senses uses a simplified Item Response Theory (IRT) model. If you answer correctly,
                                the next question becomes harder and worth more points. If you falter, it adapts to find your true baseline.
                            </p>
                            <p className="text-zinc-400 leading-relaxed">
                                This allows us to accurately distinguish between a "Strategist" and an "Outlier" in fewer than 30 questions,
                                respecting your time while maximizing signal precision.
                            </p>
                        </div>
                        <div className="col-span-1 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                            <div className="text-xs text-zinc-500 font-mono mb-2">SCORING FORMULA</div>
                            <div className="font-mono text-green-400 text-lg">
                                Score = (Accuracy × Difficulty) ÷ Time_Factor
                            </div>
                            <div className="mt-4 text-xs text-zinc-500">
                                * Penalties applied for integrity flags or erratic behavior.
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center pt-12 pb-24">
                    <div className="mb-8">
                        <p className="text-zinc-500 text-sm uppercase tracking-widest">Ready to verify your potential?</p>
                    </div>
                    <button
                        onClick={() => navigate("/")}
                        className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden hover:scale-105 transition-all duration-300"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Take the Assessment <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </span>
                        <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    </button>
                </section>

            </div>
        </div>
    );
}

function SectionHeader({ number, title, color }) {
    return (
        <h2 className="text-3xl md:text-4xl font-bold mb-10 flex items-center gap-4">
            <span className={`text-lg font-mono ${color} opacity-80 border border-current px-2 py-1 rounded`}>{number}</span>
            <span>{title}</span>
        </h2>
    );
}

function TierCard({ name, percentile, desc, color, bg, glow = "" }) {
    return (
        <div className={`p-6 rounded-xl border border-white/5 ${bg} ${glow} backdrop-blur-sm transition-all hover:border-white/10 hover:pb-8 duration-300`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold ${color}`}>{name}</h3>
                <span className="text-[10px] font-mono tracking-wide bg-black/40 px-2 py-1 rounded text-zinc-400 uppercase border border-white/5">{percentile}</span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{desc}</p>
        </div>
    );
}

function Feature({ icon, title, desc }) {
    return (
        <div className="flex gap-5 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-800/50 flex items-center justify-center text-xl text-zinc-200 border border-zinc-700">
                <i className={`fa-solid ${icon}`}></i>
            </div>
            <div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

export default Methodology;
