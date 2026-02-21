export default function SkeletonItem({ className }) {
    return (
        <div className={`animate-pulse bg-zinc-800 rounded ${className}`}></div>
    );
}

export function ResultSkeleton() {
    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <SkeletonItem className="h-10 w-64 mb-4" />

            <div className="bg-zinc-900 p-6 rounded-xl text-center border border-zinc-800 space-y-2">
                <SkeletonItem className="h-16 w-24 mx-auto" />
                <SkeletonItem className="h-4 w-32 mx-auto" />
            </div>

            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-2">
                <SkeletonItem className="h-6 w-32" />
                <SkeletonItem className="h-4 w-full" />
                <SkeletonItem className="h-4 w-5/6" />
            </div>

            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-zinc-900 p-4 rounded-lg">
                        <SkeletonItem className="h-4 w-24 mb-2" />
                        <SkeletonItem className="h-6 w-16" />
                    </div>
                ))}
            </div>

            <SkeletonItem className="h-12 w-full rounded-xl" />
        </div>
    );
}
