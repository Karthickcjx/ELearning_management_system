import React, { useRef, useState } from "react";
import { Upload, X, Camera } from "lucide-react";

const ImgUpload = ({ onChange, src, isLoading, variant = "dropzone" }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveSrc = preview || src;

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  const dispatchChange = (file) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    if (onChange) {
      const synthetic = { target: { files: [file] } };
      onChange(synthetic);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    dispatchChange(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    dispatchChange(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (event) => {
    event.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (variant === "avatar") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={triggerSelect}
          className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Change profile picture"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          ) : effectiveSrc ? (
            <img src={effectiveSrc} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <span className="text-xs text-slate-500 text-center px-1">Upload</span>
          )}
          <span className="absolute bottom-0 right-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white border-2 border-white">
            <Camera size={12} />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={triggerSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-[200px] h-[200px] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isDragging ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary"
        }`}
        aria-label="Upload profile image"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
        ) : effectiveSrc ? (
          <>
            <img src={effectiveSrc} alt="Profile" className="object-cover w-full h-full" />
            <span
              role="button"
              tabIndex={0}
              onClick={handleRemove}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleRemove(e)}
              className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Remove image"
            >
              <X size={14} />
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500 px-4 text-center">
            <Upload size={28} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Drag &amp; drop or click</span>
            <span className="text-xs text-slate-400">PNG or JPG</span>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImgUpload;
