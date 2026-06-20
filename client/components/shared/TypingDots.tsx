export default function TypingDots() {
    return (
        <div
            className="flex items-center gap-1 px-3 py-2.5"
        >
            {[0, 1, 2].map((i) => (
                <span
                    key = {i}
                    className="w-2 h-2 rounded-full bg-slate-400 inline-block"
                    style={{
                        animation: `bounce 1.2s infinite ease-in-out ${i * 0.2}s`
                    }}
                />
            ))}
        </div>
    );    
}