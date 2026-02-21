export default function IntelligenceBreakdown({ breakdown }) {
    return (
        <div className="space-y-3">
            {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="bg-zinc-900 p-4 rounded-lg">
                    <div className="text-sm text-zinc-400 uppercase">{key}</div>
                    <div className="text-xl font-bold">{value}</div>
                </div>
            ))}
        </div>
    );
}
