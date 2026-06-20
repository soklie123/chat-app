export default function FilePreview({
  fileUrl,
  fileName,
  fileType,
  isImage,
}: {
  fileUrl:   string;
  fileName?: string;
  fileType?: string;
  isImage?:  boolean;
}) {
  if (isImage) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-[220px]">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={fileUrl}
            alt={fileName ?? "image"}
            className="w-full h-auto rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          />
        </a>
      </div>
    );
  }

  // Document / other file
  const ext = fileName?.split(".").pop()?.toUpperCase() ?? "FILE";
  const isPDF = fileType === "application/pdf";

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-black/5 hover:bg-black/10 transition-colors max-w-[220px]"
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
        isPDF ? "bg-red-500" : "bg-blue-500"
      }`}>
        {ext}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium truncate">{fileName}</div>
        <div className="text-[10px] text-slate-400">Tap to download</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 flex-shrink-0">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </a>
  );
}