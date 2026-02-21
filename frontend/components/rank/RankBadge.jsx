export default function RankBadge({ rank, percentile }) {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl text-center">
            <div className="text-sm uppercase">Global Rank</div>
            <div className="text-5xl font-extrabold">#{rank}</div>
            <div className="text-zinc-200 mt-1">
                Top {percentile}%
            </div>
        </div>
    );
}
