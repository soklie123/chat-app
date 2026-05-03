import { useRef } from "react";

export function useLongPress(onLongPress: () => void, delay = 500) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const start = () => {
        timer.current = setTimeout(() => onLongPress(), delay);
    };

    const cancel = () => {
        if (timer.current) clearTimeout(timer.current);
    }; 

    return {
        onTouchStart: start,
        onTouchEnd: cancel,
        onTouchMove: cancel, // cancel if user scrolls
    }
}