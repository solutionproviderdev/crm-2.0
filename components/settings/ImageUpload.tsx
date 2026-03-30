"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, UploadCloud } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (file: File) => Promise<void>;
  label: string;
  className?: string;
  shape?: "square" | "circle" | "rectangle";
  aspectRatio?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  label, 
  className,
  shape = "square",
  aspectRatio = "1/1"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onChange(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-3">{label}</p>
      
      <div 
        className={cn(
          "relative group overflow-hidden border-2 border-dashed border-gray-200 hover:border-[var(--brand-primary)]/30 transition-all bg-gray-50/50",
          shape === "circle" ? "rounded-full" : "rounded-3xl",
        )}
        style={{ aspectRatio }}
      >
        {value ? (
          <>
            <img 
              src={value} 
              alt={label} 
              className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                className="rounded-xl h-8 bg-white/20 backdrop-blur-md text-white border-none hover:bg-white/30"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                Change
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="h-full w-full flex flex-col items-center justify-center p-6 text-gray-400 hover:text-[var(--brand-primary)] transition-colors gap-2 focus:outline-none"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 group-hover:ring-[var(--brand-primary)]/20 group-hover:shadow-md transition-all">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight">Click to upload</p>
                  <p className="text-[10px] opacity-60 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </>
            )}
          </button>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
