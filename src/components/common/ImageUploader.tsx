import React, { useState, useRef } from 'react';
import { Upload, X, Folder, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string; // Base64 data URL or image source
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  aspectRatio?: 'square' | 'banner';
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label,
  required = false,
  aspectRatio = 'square',
  helperText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(file: File) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-1.5 text-xs">
      {label && (
        <label className="block font-medium text-zinc-700">
          {label} {required && <span className="text-rose-600 font-bold">* Compulsory</span>}
        </label>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
      />

      {value ? (
        /* Image Preview Box with Actions */
        <div className="relative rounded-xl border border-zinc-200 overflow-hidden group bg-zinc-900">
          <img
            src={value}
            alt="Uploaded preview"
            className={`w-full object-cover ${aspectRatio === 'banner' ? 'h-36 sm:h-44' : 'h-40 sm:h-48'}`}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-zinc-900 rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-zinc-100"
            >
              <Folder className="w-3.5 h-3.5" /> Select Different File
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-rose-600 text-white rounded-lg font-semibold text-xs shadow-md cursor-pointer hover:bg-rose-700"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone + File Selector */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 scale-[1.01]'
              : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50 text-zinc-600'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-600">
            <Upload className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 text-xs">
              <span className="text-emerald-600 underline">Select photo from folder</span> or drag &amp; drop file here
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Supports PNG, JPG, JPEG, WEBP or GIF from device</p>
          </div>
          <button
            type="button"
            className="mt-1 px-3 py-1.5 bg-white border border-zinc-300 text-zinc-700 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-zinc-50 pointer-events-none"
          >
            <Folder className="w-3.5 h-3.5 text-zinc-500" /> Browse Local Folders
          </button>
        </div>
      )}

      {helperText && <p className="text-[10px] text-zinc-500 mt-1">{helperText}</p>}
    </div>
  );
};
