const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
export default function ReactionPicker({
    onSelect,
}: {
    onSelect: (emoji: string) => void;
}) {
    return (
        <div 
            data-reaction-picker
            className="
            flex items-center gap-1 px-2 py-1.5 bg-white rounded-full 
            shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100
            ">
        {EMOJIS.map((emoji) => (
            <button
            key={emoji}
            data-reaction-picker
            onClick={(e) => { 
                e.stopPropagation(); // Prevent event bubbling
                onSelect(emoji)}}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-110 transition-all text-[16px]"
            >
            {emoji}
            </button>
        ))}
        </div>
    );
}