import { getAvatarColor } from "../hooks/useChat";

export default function Avatar({
    name,
    size = 34,
    ring = false,
}: {
    name: string;
    size?: number;
    ring?: boolean;
}) {
    const safeName = name || "";
    return (
        <div
            className="flex items-center justify-center rounded-full font-medium text-white flex-shrink-0"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.38,
                background: getAvatarColor(safeName),
                border: ring ? "2px solid #0088cc" : "none"
            }}
        >
            {safeName.charAt(0).toUpperCase()}
        </div>
    );
}