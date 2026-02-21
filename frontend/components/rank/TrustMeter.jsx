export default function TrustMeter({ trust }) {
    return (
        <div className="bg-zinc-900 p-4 rounded-lg">
            <div className="text-sm text-zinc-400">Trust Score</div>
            <div className="text-2xl font-bold">{trust}/100</div>
        </div>
    );
}
