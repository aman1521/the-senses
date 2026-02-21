import { useEffect, useState } from "react";

export default function useTimer(seconds, onExpire) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire();
            return;
        }

        const timer = setTimeout(
            () => setTimeLeft((t) => t - 1),
            1000
        );

        return () => clearTimeout(timer);
    }, [timeLeft]);

    return timeLeft;
}
