export default function Timer({ timeLeft }) {
    return (
        <div className="text-sm text-zinc-400">
            Time left: <span className="font-bold">{timeLeft}s</span>
        </div>
    );
}
